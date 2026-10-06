// ==========================================================================
// CHRIS SHOPPER — DYNAMIC PLATFORMS & CATEGORIES SERVICE
// Manages real-time platform catalog retrieval from Appwrite Cloud DB,
// dynamic creation, editing & deletion of platforms & packages.
// ==========================================================================

import { APPWRITE_CONFIG, functions, databases, Query } from './appwrite';
import { PLATFORM_CATEGORIES } from '../data/sampleLogsData';

const CACHE_KEY = 'cs_platforms_catalog_cache';
let memoryCache = null;

/**
 * Fetch all active platforms and product packages.
 * Dynamically queries Appwrite Cloud DB (platforms_catalog),
 * falling back gracefully to local storage and static defaults.
 */
export async function fetchDynamicPlatforms(forceRefresh = false) {
  if (!forceRefresh && memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      'platforms_catalog',
      [Query.equal('is_active', true), Query.limit(100)]
    );

    if (response && response.documents && response.documents.length > 0) {
      const platforms = response.documents.map(doc => {
        let items = [];
        try {
          items = JSON.parse(doc.packages_json || '[]');
        } catch {
          items = [];
        }

        let delimiterConfig = null;
        if (doc.delimiter_config) {
          try {
            delimiterConfig = typeof doc.delimiter_config === 'string' ? JSON.parse(doc.delimiter_config) : doc.delimiter_config;
          } catch {}
        }

        return {
          id: doc.platform_id,
          name: doc.name,
          subtitle: doc.subtitle || '',
          tag: doc.tag || doc.name,
          icon: doc.icon || 'facebook',
          color: doc.color || '#38bdf8',
          collectionId: doc.collection_id,
          demoPrice: Number(doc.demo_price || 1500),
          delimiterConfig,
          delimiter_config: doc.delimiter_config,
          has2fa: Boolean(doc.has_2fa),
          items: items.map(item => ({
            ...item,
            platform: item.platform || doc.name,
            has2fa: item.has2fa !== undefined ? Boolean(item.has2fa) : (item.has_2fa !== undefined ? Boolean(item.has_2fa) : false),
            price: Number(item.price !== undefined ? item.price : (doc.demo_price || 1500))
          }))
        };
      });

      memoryCache = platforms;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(platforms));
      } catch {}
      return platforms;
    }
  } catch (err) {
    console.warn('Error fetching dynamic platforms from Appwrite DB, checking local cache:', err.message);
  }

  // Attempt local cache fallback
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch {}

  // Ultimate fallback to default static categories
  memoryCache = PLATFORM_CATEGORIES;
  return PLATFORM_CATEGORIES;
}

/**
 * Invalidate internal and local storage cache and emit sync event
 */
function invalidateCache(platformId = '') {
  memoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('platforms-updated', { detail: { platformId } }));
}

/**
 * Create a new platform category in Appwrite.
 */
export async function createPlatform({
  id,
  name,
  subtitle,
  tag,
  icon,
  color,
  demoPrice,
  packages,
  has2fa
}) {
  if (!id || !name) {
    throw new Error('Platform ID and Name are required.');
  }

  const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'create_platform',
        platformId: cleanId,
        name: name.trim(),
        subtitle: subtitle || '',
        tag: tag || name.trim(),
        icon: icon || 'generic_globe',
        color: color || '#38bdf8',
        demoPrice: Number(demoPrice || 1500),
        packages: packages || [],
        has2fa: Boolean(has2fa)
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        invalidateCache(cleanId);
        return result;
      } else if (result.error) {
        throw new Error(result.error);
      }
    }

    throw new Error('Empty or invalid response from serverless platform provisioner.');
  } catch (err) {
    console.error('Failed to create platform:', err);
    throw err;
  }
}

/**
 * Update an existing platform category (name, subtitle, tag, icon, color, base price)
 */
export async function updatePlatform(platformId, updates = {}) {
  if (!platformId) throw new Error('Platform ID is required.');

  // 1. Try serverless function
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'update_platform',
        platformId,
        updates,
        ...updates
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        invalidateCache(platformId);
        return result;
      }
    }
  } catch (fnErr) {
    console.warn('Serverless update_platform notice:', fnErr.message);
  }

  // 2. Direct database fallback
  try {
    const list = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      'platforms_catalog',
      [Query.equal('platform_id', platformId), Query.limit(1)]
    );
    if (list.documents.length > 0) {
      const doc = list.documents[0];
      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle.trim();
      if (updates.tag !== undefined) payload.tag = updates.tag.trim();
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.demoPrice !== undefined) payload.demo_price = Number(updates.demoPrice);
      if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
      if (updates.has2fa !== undefined || updates.has_2fa !== undefined) {
        payload.has_2fa = Boolean(updates.has2fa ?? updates.has_2fa);
      }
      if (updates.delimiter_config !== undefined) {
        payload.delimiter_config = typeof updates.delimiter_config === 'string' ? updates.delimiter_config : JSON.stringify(updates.delimiter_config);
      }
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        'platforms_catalog',
        doc.$id,
        payload
      );
      invalidateCache(platformId);
      return { success: true, platformId, updated: payload };
    }
  } catch (dbErr) {
    console.error('Direct DB update_platform failed:', dbErr);
    throw dbErr;
  }

  throw new Error('Failed to update platform.');
}

/**
 * Delete a platform from the catalog (supports ANY platform, including defaults).
 */
export async function deletePlatform(platformId) {
  if (!platformId) throw new Error('Platform ID is required.');

  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'delete_platform',
        platformId
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        invalidateCache(platformId);
        return result;
      } else if (result.error) {
        throw new Error(result.error);
      }
    }

    throw new Error('Failed to delete platform.');
  } catch (err) {
    console.error('Delete platform error:', err);
    throw err;
  }
}

/**
 * Add a new product type/package to an existing platform.
 */
export async function addProductPackage(platformId, packageData) {
  if (!platformId || !packageData || !packageData.title) {
    throw new Error('Platform ID and Package Title are required.');
  }

  // 1. Try serverless function
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'add_platform_package',
        platformId,
        packageData
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        invalidateCache(platformId);
        return result;
      }
    }
  } catch (fnErr) {
    console.warn('Serverless add_platform_package notice:', fnErr.message);
  }

  // 2. Direct database fallback
  try {
    const list = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      'platforms_catalog',
      [Query.equal('platform_id', platformId), Query.limit(1)]
    );
    if (list.documents.length > 0) {
      const doc = list.documents[0];
      let currentPackages = [];
      try {
        currentPackages = JSON.parse(doc.packages_json || '[]');
      } catch {}

      const pkgId = packageData.id || `${platformId}-type-${Date.now()}`;
      const newPkg = {
        id: pkgId,
        title: packageData.title.trim(),
        platform: packageData.platform || doc.name,
        price: Number(packageData.price !== undefined ? packageData.price : doc.demo_price || 1500),
        description: packageData.description ? packageData.description.trim() : '',
        has2fa: Boolean(packageData.has2fa ?? packageData.has_2fa ?? false)
      };

      currentPackages.push(newPkg);

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        'platforms_catalog',
        doc.$id,
        { packages_json: JSON.stringify(currentPackages) }
      );
      invalidateCache(platformId);
      return { success: true, platformId, package: newPkg, packages: currentPackages };
    }
  } catch (dbErr) {
    console.error('Direct DB add_platform_package failed:', dbErr);
    throw dbErr;
  }

  throw new Error('Failed to add product package to platform.');
}

/**
 * Update an existing product package within a platform.
 */
export async function updateProductPackage(platformId, packageId, updates) {
  if (!platformId || !packageId) {
    throw new Error('Platform ID and Package ID are required.');
  }

  // 1. Try serverless function
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'update_platform_package',
        platformId,
        packageId,
        packageData: updates,
        updates
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        invalidateCache(platformId);
        return result;
      }
    }
  } catch (fnErr) {
    console.warn('Serverless update_platform_package notice:', fnErr.message);
  }

  // 2. Direct database fallback
  try {
    const list = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      'platforms_catalog',
      [Query.equal('platform_id', platformId), Query.limit(1)]
    );
    if (list.documents.length > 0) {
      const doc = list.documents[0];
      let currentPackages = [];
      try {
        currentPackages = JSON.parse(doc.packages_json || '[]');
      } catch {}

      const pkgIndex = currentPackages.findIndex(p => p.id === packageId);
      if (pkgIndex >= 0) {
        currentPackages[pkgIndex] = {
          ...currentPackages[pkgIndex],
          title: updates.title !== undefined ? updates.title.trim() : currentPackages[pkgIndex].title,
          price: updates.price !== undefined ? Number(updates.price) : currentPackages[pkgIndex].price,
          description: updates.description !== undefined ? updates.description.trim() : (currentPackages[pkgIndex].description || ''),
          has2fa: updates.has2fa !== undefined ? Boolean(updates.has2fa) : (updates.has_2fa !== undefined ? Boolean(updates.has_2fa) : Boolean(currentPackages[pkgIndex].has2fa ?? currentPackages[pkgIndex].has_2fa ?? false))
        };

        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          'platforms_catalog',
          doc.$id,
          { packages_json: JSON.stringify(currentPackages) }
        );
        invalidateCache(platformId);
        return { success: true, platformId, packageId, package: currentPackages[pkgIndex] };
      }
    }
  } catch (dbErr) {
    console.error('Direct DB update_platform_package failed:', dbErr);
    throw dbErr;
  }

  throw new Error('Failed to update product package.');
}

/**
 * Delete a product package from a platform.
 */
export async function deleteProductPackage(platformId, packageId) {
  if (!platformId || !packageId) {
    throw new Error('Platform ID and Package ID are required.');
  }

  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'delete_platform_package',
        platformId,
        packageId
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        invalidateCache(platformId);
        return result;
      } else if (result.error) {
        throw new Error(result.error);
      }
    }

    throw new Error('Failed to delete product package.');
  } catch (err) {
    console.error('Delete package error:', err);
    throw err;
  }
}
