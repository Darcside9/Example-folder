import { Client, Databases, Query, ID } from 'node-appwrite';

const COLLECTIONS = {
  facebook: '6ab9702e001dc7115654',
  tiktok: '6ab97045000451688a63',
  instagram: '6ab9704e00116f8d983c',
  twitter: '6ab9706a003a134738d5',
  textplus: '6ab9707300032f996f8c',
  platforms_catalog: 'platforms_catalog',
  products_pricing: 'products_pricing',
  user_profiles: 'user_profiles',
  orders: 'orders'
};

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '6ab96f3c0031c3231183';

/**
 * Resolves collection ID for a given platformId.
 * Checks static map first, then queries platforms_catalog dynamically.
 */
async function getPlatformCollectionId(databases, platformId) {
  if (COLLECTIONS[platformId]) return COLLECTIONS[platformId];
  try {
    const list = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
      Query.equal('platform_id', platformId),
      Query.limit(1)
    ]);
    if (list.documents.length > 0 && list.documents[0].collection_id) {
      return list.documents[0].collection_id;
    }
  } catch (err) {
    // Ignore and fallback
  }
  return null;
}

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '6ab96624002e549083d1')
    .setKey(process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key']);

  const databases = new Databases(client);

  let data = {};
  try {
    data = req.bodyJson || (req.body ? JSON.parse(req.body) : {});
  } catch (e) {
    return res.json({ error: 'Invalid JSON request payload' }, 400);
  }

  const { action, platformId, subTypeId, username, userId, userEmail, price, records } = data;
  log(`Executing log-dispenser action: ${action} for platform: ${platformId || 'N/A'}`);

  // ACTION 1: LIST AVAILABLE (SANITIZED BROWSING)
  if (action === 'list_available') {
    const colId = await getPlatformCollectionId(databases, platformId);
    if (!colId) {
      return res.json({ error: `Unknown platform: ${platformId}` }, 400);
    }

    try {
      const queries = [Query.equal('status', 'available'), Query.limit(100)];
      if (subTypeId) {
        queries.push(Query.equal('sub_type_id', subTypeId));
      }

      const result = await databases.listDocuments(DATABASE_ID, colId, queries);
      
      // CRITICAL SECURITY SANITIZATION:
      // Strip out password, two_factor_key, and mail_password before sending to client!
      const sanitized = result.documents.map(doc => ({
        id: doc.$id,
        username: doc.username,
        subTypeId: doc.sub_type_id,
        subTypeTitle: doc.sub_type_title,
        price: doc.price || 1500,
        status: doc.status,
        isAvailable: doc.status === 'available'
      }));

      return res.json({
        success: true,
        platformId,
        total: sanitized.length,
        accounts: sanitized
      });
    } catch (err) {
      error(`Error querying available logs: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 2: PURCHASE & DISPENSE (ATOMIC TRANSACTION WITH BALANCE DEDUCTION IN NAIRA)
  if (action === 'purchase_log') {
    if (!platformId || !username || !userId) {
      return res.json({ error: 'Missing required purchase parameters (platformId, username, userId)' }, 400);
    }

    const colId = await getPlatformCollectionId(databases, platformId);
    if (!colId) {
      return res.json({ error: `Unknown platform: ${platformId}` }, 400);
    }

    try {
      // 1. Fetch target account log and verify availability FIRST
      const targetQuery = await databases.listDocuments(DATABASE_ID, colId, [
        Query.equal('username', username),
        Query.equal('status', 'available'),
        Query.limit(1)
      ]);

      if (targetQuery.documents.length === 0) {
        return res.json({ error: `Account @${username} is no longer available. Please select another username.` }, 409);
      }

      const targetDoc = targetQuery.documents[0];

      // Determine price: prioritize passed price, then log doc price, then 1500
      const requiredPrice = Number(targetDoc.price !== undefined ? targetDoc.price : (price !== undefined ? price : 1500));

      // 2. Verify user profile & balance in Appwrite user_profiles
      let userDoc = null;
      try {
        let userDocs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.user_profiles, [
          Query.equal('user_id', userId),
          Query.limit(1)
        ]);
        if (userDocs.documents.length === 0 && userEmail) {
          userDocs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.user_profiles, [
            Query.equal('email', userEmail),
            Query.limit(1)
          ]);
        }
        userDoc = userDocs.documents[0] || null;
      } catch (err) {
        log(`Note reading user profile: ${err.message}`);
      }

      // If user profile doesn't exist yet, auto-create one with fallback balance in Naira
      if (!userDoc) {
        try {
          const initialBalance = Number(data.currentBalance !== undefined ? data.currentBalance : 5000.00);
          userDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.user_profiles, ID.unique(), {
            user_id: userId,
            email: userEmail || '',
            contact_info: '',
            balance: initialBalance,
            role: 'user'
          });
          log(`Created user profile in user_profiles for ${userId} with initial balance ₦${initialBalance}`);
        } catch (createErr) {
          log(`Error auto-creating user profile: ${createErr.message}`);
        }
      }

      const currentBalance = userDoc ? Number(userDoc.balance || 0) : 0;
      if (currentBalance < requiredPrice) {
        return res.json({ 
          error: `Insufficient wallet balance (₦${currentBalance.toLocaleString()} available, ₦${requiredPrice.toLocaleString()} required). Please top up your wallet.` 
        }, 400);
      }

      // 3. Deduct user balance atomically
      const newBalance = Number((currentBalance - requiredPrice).toFixed(2));
      if (userDoc) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.user_profiles, userDoc.$id, {
          balance: newBalance
        });
      }

      // 4. Mark account log as sold
      await databases.updateDocument(DATABASE_ID, colId, targetDoc.$id, {
        status: 'sold',
        sold_to_user_id: userId,
        sold_to_email: userEmail || '',
        sold_at: new Date().toISOString()
      });

      // 5. Create order audit record
      await databases.createDocument(DATABASE_ID, COLLECTIONS.orders, ID.unique(), {
        user_id: userId,
        user_email: userEmail || '',
        product_type: 'account_log',
        item_name: `${targetDoc.sub_type_title || platformId} (@${targetDoc.username})`,
        reference: targetDoc.username,
        price: requiredPrice,
        status: 'completed',
        details: JSON.stringify({
          platform: platformId,
          username: targetDoc.username,
          subTypeId: targetDoc.sub_type_id,
          price: requiredPrice,
          newBalance: newBalance
        })
      });

      // 6. Return single credential pack AND newBalance ONLY to this buyer
      return res.json({
        success: true,
        newBalance: newBalance,
        credential: {
          platform: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          username: targetDoc.username,
          password: targetDoc.password,
          twoFactorKey: targetDoc.two_factor_key,
          mail: targetDoc.mail,
          mailPassword: targetDoc.mail_password,
          price: requiredPrice,
          purchasedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      error(`Purchase transaction error: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 3: ADMIN BULK IMPORT
  if (action === 'admin_bulk_import') {
    if (!platformId || !Array.isArray(records) || records.length === 0) {
      return res.json({ error: 'No records provided for import' }, 400);
    }

    const colId = await getPlatformCollectionId(databases, platformId);
    if (!colId) {
      return res.json({ error: `Unknown platform: ${platformId}` }, 400);
    }

    try {
      let createdCount = 0;
      for (const rec of records) {
        await databases.createDocument(DATABASE_ID, colId, ID.unique(), {
          username: rec.username,
          password: rec.password,
          two_factor_key: rec.twoFactorKey,
          mail: rec.mail,
          mail_password: rec.mailPassword,
          sub_type_id: subTypeId || rec.subTypeId,
          sub_type_title: rec.subTypeTitle || '',
          price: Number(price || rec.price || 1500),
          status: 'available'
        });
        createdCount++;
      }

      return res.json({
        success: true,
        platformId,
        importedCount: createdCount
      });
    } catch (err) {
      error(`Admin bulk import error: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 4: CREATE PLATFORM & AUTO-PROVISION LOGS COLLECTION
  if (action === 'create_platform') {
    const { name, subtitle, tag, icon, color, demoPrice, packages } = data;
    const reqPlatformId = data.platformId;
    if (!reqPlatformId || !name) {
      return res.json({ error: 'platformId and name are required' }, 400);
    }

    const cleanPlatformId = reqPlatformId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    // Check if platform already exists
    try {
      const existing = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
        Query.equal('platform_id', cleanPlatformId),
        Query.limit(1)
      ]);
      if (existing.documents.length > 0) {
        return res.json({ error: `Platform '${cleanPlatformId}' already exists in catalog.` }, 409);
      }
    } catch (e) {
      log(`Check existing platform note: ${e.message}`);
    }

    // Collection ID max length is 36 in Appwrite
    const logsColId = `logs_${cleanPlatformId}`.slice(0, 36);

    try {
      log(`Creating private collection ${logsColId} for ${name}...`);
      await databases.createCollection(
        DATABASE_ID,
        logsColId,
        `${name} Logs`,
        [] // zero-trust permissions: dispenser only
      );

      // Attributes to provision
      const standardAttrs = [
        { key: 'username', type: 'string', size: 255, req: true },
        { key: 'password', type: 'string', size: 255, req: true },
        { key: 'two_factor_key', type: 'string', size: 255, req: false, def: '' },
        { key: 'mail', type: 'string', size: 255, req: false, def: '' },
        { key: 'mail_password', type: 'string', size: 255, req: false, def: '' },
        { key: 'sub_type_id', type: 'string', size: 100, req: false, def: '' },
        { key: 'sub_type_title', type: 'string', size: 255, req: false, def: '' },
        { key: 'price', type: 'float', req: false, def: Number(demoPrice || 1500) },
        { key: 'status', type: 'string', size: 50, req: false, def: 'available' },
        { key: 'sold_to_user_id', type: 'string', size: 100, req: false, def: '' },
        { key: 'sold_to_email', type: 'string', size: 255, req: false, def: '' },
        { key: 'sold_at', type: 'string', size: 100, req: false, def: '' }
      ];

      for (const attr of standardAttrs) {
        try {
          if (attr.type === 'string') {
            await databases.createStringAttribute(DATABASE_ID, logsColId, attr.key, attr.size, attr.req, attr.def);
          } else if (attr.type === 'float') {
            await databases.createFloatAttribute(DATABASE_ID, logsColId, attr.key, attr.req, undefined, undefined, attr.def);
          }
          await new Promise(r => setTimeout(r, 200));
        } catch (attrErr) {
          log(`Attr ${attr.key} notice: ${attrErr.message}`);
        }
      }

      // Provision indexes
      const indexList = [
        { key: 'idx_status', type: 'key', attrs: ['status'] },
        { key: 'idx_username', type: 'key', attrs: ['username'] },
        { key: 'idx_sub_type_id', type: 'key', attrs: ['sub_type_id'] }
      ];
      for (const idx of indexList) {
        try {
          await databases.createIndex(DATABASE_ID, logsColId, idx.key, idx.type, idx.attrs);
          await new Promise(r => setTimeout(r, 200));
        } catch (idxErr) {
          log(`Index ${idx.key} notice: ${idxErr.message}`);
        }
      }

      // Format initial packages (DO NOT auto-generate if empty!)
      let initialPackages = [];
      if (Array.isArray(packages)) {
        initialPackages = packages;
      } else if (typeof packages === 'string') {
        try {
          initialPackages = JSON.parse(packages);
        } catch {}
      }

      // Add to platforms_catalog
      const catalogPayload = {
        platform_id: cleanPlatformId,
        name: name,
        subtitle: subtitle || `${name} Verified Accounts`,
        tag: tag || name,
        icon: icon || 'facebook',
        color: color || '#0b0f19',
        collection_id: logsColId,
        demo_price: Number(demoPrice || 1500),
        packages_json: JSON.stringify(initialPackages),
        is_active: true
      };
      if (data.delimiter_config) {
        catalogPayload.delimiter_config = typeof data.delimiter_config === 'string' ? data.delimiter_config : JSON.stringify(data.delimiter_config);
      }

      const catalogDoc = await databases.createDocument(
        DATABASE_ID,
        'platforms_catalog',
        ID.unique(),
        catalogPayload
      );

      // Register into products_pricing so Admin pricing manager can control rates
      try {
        await databases.createDocument(DATABASE_ID, 'products_pricing', ID.unique(), {
          product_id: cleanPlatformId,
          name: name,
          price_usd: Number(demoPrice || 1500),
          unit: 'account',
          category: tag || 'social_logs',
          product_type: 'account_log',
          is_active: true,
          carrier_speed: 'Instant Delivery'
        });
      } catch (pErr) {
        log(`Pricing doc notice: ${pErr.message}`);
      }

      return res.json({
        success: true,
        platformId: cleanPlatformId,
        collectionId: logsColId,
        catalogId: catalogDoc.$id
      });
    } catch (createErr) {
      error(`Error creating platform collection: ${createErr.message}`);
      return res.json({ error: createErr.message }, 500);
    }
  }

  // ACTION 5: UPDATE EXISTING PLATFORM METADATA
  if (action === 'update_platform') {
    const targetPlatformId = data.platformId;
    const updates = data.updates || data;
    const { name, subtitle, tag, icon, color, demoPrice, is_active, delimiter_config, delimiterConfig } = updates;
    if (!targetPlatformId) return res.json({ error: 'platformId is required' }, 400);

    try {
      const list = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
        Query.equal('platform_id', targetPlatformId),
        Query.limit(1)
      ]);
      if (list.documents.length === 0) {
        return res.json({ error: `Platform ${targetPlatformId} not found in catalog` }, 404);
      }
      const doc = list.documents[0];
      const updatePayload = {};
      if (name !== undefined) updatePayload.name = name.trim();
      if (subtitle !== undefined) updatePayload.subtitle = subtitle.trim();
      if (tag !== undefined) updatePayload.tag = tag.trim();
      if (icon !== undefined) updatePayload.icon = icon;
      if (color !== undefined) updatePayload.color = color;
      if (demoPrice !== undefined) updatePayload.demo_price = Number(demoPrice);
      if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

      const dConfig = delimiter_config !== undefined ? delimiter_config : delimiterConfig;
      if (dConfig !== undefined) {
        updatePayload.delimiter_config = typeof dConfig === 'string' ? dConfig : JSON.stringify(dConfig);
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.json({ error: 'No valid update fields provided' }, 400);
      }

      await databases.updateDocument(DATABASE_ID, 'platforms_catalog', doc.$id, updatePayload);

      // Sync name & price into products_pricing if present
      try {
        const pricingDocs = await databases.listDocuments(DATABASE_ID, 'products_pricing', [
          Query.equal('product_id', targetPlatformId),
          Query.limit(1)
        ]);
        if (pricingDocs.documents.length > 0) {
          const pDoc = pricingDocs.documents[0];
          const pricingUpdates = {
            name: name !== undefined ? name.trim() : pDoc.name,
            price_usd: demoPrice !== undefined ? Number(demoPrice) : pDoc.price_usd
          };
          if (is_active !== undefined) pricingUpdates.is_active = Boolean(is_active);
          await databases.updateDocument(DATABASE_ID, 'products_pricing', pDoc.$id, pricingUpdates);
        } else {
          // If platform was missing in products_pricing, insert it now!
          await databases.createDocument(DATABASE_ID, 'products_pricing', ID.unique(), {
            product_id: targetPlatformId,
            name: name || doc.name,
            price_usd: Number(demoPrice !== undefined ? demoPrice : (doc.demo_price || 1500)),
            unit: 'account',
            category: tag || doc.tag || 'social_logs',
            product_type: 'account_log',
            is_active: is_active !== undefined ? Boolean(is_active) : (doc.is_active !== undefined ? Boolean(doc.is_active) : true),
            carrier_speed: 'Instant Delivery'
          });
        }
      } catch (pErr) {
        log(`Pricing sync note: ${pErr.message}`);
      }

      return res.json({ success: true, platformId: targetPlatformId, updated: updatePayload });
    } catch (err) {
      error(`Error updating platform: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 6: ADD PRODUCT PACKAGE / SUB-TYPE TO PLATFORM
  if (action === 'add_platform_package') {
    const { platformId: targetPlatformId, packageData } = data;
    if (!targetPlatformId || !packageData || !packageData.title) {
      return res.json({ error: 'platformId and packageData with title are required' }, 400);
    }

    try {
      const list = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
        Query.equal('platform_id', targetPlatformId),
        Query.limit(1)
      ]);
      if (list.documents.length === 0) {
        return res.json({ error: `Platform ${targetPlatformId} not found in catalog` }, 404);
      }

      const doc = list.documents[0];
      let currentPackages = [];
      try {
        currentPackages = JSON.parse(doc.packages_json || '[]');
      } catch {}

      const pkgId = packageData.id || `${targetPlatformId}-type-${Date.now()}`;
      const newPkg = {
        id: pkgId,
        title: packageData.title.trim(),
        platform: packageData.platform || doc.name,
        price: Number(packageData.price !== undefined ? packageData.price : doc.demo_price || 1500),
        description: packageData.description ? packageData.description.trim() : ''
      };

      currentPackages.push(newPkg);

      await databases.updateDocument(DATABASE_ID, 'platforms_catalog', doc.$id, {
        packages_json: JSON.stringify(currentPackages)
      });

      return res.json({
        success: true,
        platformId: targetPlatformId,
        package: newPkg,
        packages: currentPackages
      });
    } catch (err) {
      error(`Error adding platform package: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 7: UPDATE EXISTING PRODUCT PACKAGE / SUB-TYPE
  if (action === 'update_platform_package') {
    const targetPlatformId = data.platformId;
    const packageId = data.packageId;
    const packageData = data.packageData || data.updates || {};
    if (!targetPlatformId || !packageId || Object.keys(packageData).length === 0) {
      return res.json({ error: 'platformId, packageId, and packageData are required' }, 400);
    }

    try {
      const list = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
        Query.equal('platform_id', targetPlatformId),
        Query.limit(1)
      ]);
      if (list.documents.length === 0) {
        return res.json({ error: `Platform ${targetPlatformId} not found in catalog` }, 404);
      }

      const doc = list.documents[0];
      let currentPackages = [];
      try {
        currentPackages = JSON.parse(doc.packages_json || '[]');
      } catch {}

      const pkgIndex = currentPackages.findIndex(p => p.id === packageId);
      if (pkgIndex === -1) {
        return res.json({ error: `Package ${packageId} not found in platform ${targetPlatformId}` }, 404);
      }

      currentPackages[pkgIndex] = {
        ...currentPackages[pkgIndex],
        title: packageData.title !== undefined ? packageData.title.trim() : currentPackages[pkgIndex].title,
        price: packageData.price !== undefined ? Number(packageData.price) : currentPackages[pkgIndex].price,
        description: packageData.description !== undefined ? packageData.description.trim() : (currentPackages[pkgIndex].description || '')
      };

      await databases.updateDocument(DATABASE_ID, 'platforms_catalog', doc.$id, {
        packages_json: JSON.stringify(currentPackages)
      });

      return res.json({
        success: true,
        platformId: targetPlatformId,
        packageId,
        package: currentPackages[pkgIndex],
        packages: currentPackages
      });
    } catch (err) {
      error(`Error updating package: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 8: DELETE PRODUCT PACKAGE / SUB-TYPE
  if (action === 'delete_platform_package') {
    const { platformId: targetPlatformId, packageId } = data;
    if (!targetPlatformId || !packageId) {
      return res.json({ error: 'platformId and packageId are required' }, 400);
    }

    try {
      const list = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
        Query.equal('platform_id', targetPlatformId),
        Query.limit(1)
      ]);
      if (list.documents.length === 0) {
        return res.json({ error: `Platform ${targetPlatformId} not found in catalog` }, 404);
      }

      const doc = list.documents[0];
      let currentPackages = [];
      try {
        currentPackages = JSON.parse(doc.packages_json || '[]');
      } catch {}

      const filtered = currentPackages.filter(p => p.id !== packageId);

      await databases.updateDocument(DATABASE_ID, 'platforms_catalog', doc.$id, {
        packages_json: JSON.stringify(filtered)
      });

      return res.json({
        success: true,
        platformId: targetPlatformId,
        deletedPackageId: packageId,
        packages: filtered
      });
    } catch (err) {
      error(`Error deleting package: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  // ACTION 9: DELETE / ARCHIVE PLATFORM (ALL PLATFORMS SUPPORTED)
  if (action === 'delete_platform') {
    const { platformId: targetPlatformId } = data;
    if (!targetPlatformId) return res.json({ error: 'platformId is required' }, 400);

    try {
      const list = await databases.listDocuments(DATABASE_ID, 'platforms_catalog', [
        Query.equal('platform_id', targetPlatformId),
        Query.limit(1)
      ]);
      if (list.documents.length === 0) {
        return res.json({ error: `Platform ${targetPlatformId} not found` }, 404);
      }
      const doc = list.documents[0];
      await databases.deleteDocument(DATABASE_ID, 'platforms_catalog', doc.$id);

      // Also clean up products_pricing entry if found
      try {
        const pricingDocs = await databases.listDocuments(DATABASE_ID, 'products_pricing', [
          Query.equal('product_id', targetPlatformId),
          Query.limit(1)
        ]);
        if (pricingDocs.documents.length > 0) {
          await databases.deleteDocument(DATABASE_ID, 'products_pricing', pricingDocs.documents[0].$id);
        }
      } catch (pErr) {
        log(`Pricing cleanup note: ${pErr.message}`);
      }

      return res.json({ success: true, deletedPlatformId: targetPlatformId });
    } catch (err) {
      error(`Error deleting platform: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  return res.json({ error: `Unrecognized action: ${action}` }, 400);
};
