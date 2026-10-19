// ==========================================================================
// CHRIS SHOPPER — DYNAMIC PLATFORMS & CATEGORIES SERVICE
// Manages real-time platform catalog retrieval from Google Firebase Firestore,
// dynamic creation, editing & deletion of platforms & packages.
// ==========================================================================

import { 
  db, 
  FIREBASE_COLLECTIONS,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from './firebase';
import { PLATFORM_CATEGORIES } from '../data/sampleLogsData';

const CACHE_KEY = 'cs_platforms_catalog_cache';
let memoryCache = null;

/**
 * Fetch all active platforms and product packages from Google Firebase Firestore.
 */
export async function fetchDynamicPlatforms(forceRefresh = false) {
  if (!forceRefresh && memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  if (db) {
    try {
      const colRef = collection(db, FIREBASE_COLLECTIONS.platforms_catalog);
      const snap = await getDocs(colRef);

      if (!snap.empty) {
        const platforms = snap.docs
          .map(d => {
            const data = d.data();
            let items = [];
            try {
              items = typeof data.packages_json === 'string' 
                ? JSON.parse(data.packages_json || '[]') 
                : (data.packages_json || []);
            } catch {
              items = [];
            }

            let delimiterConfig = null;
            if (data.delimiter_config) {
              try {
                delimiterConfig = typeof data.delimiter_config === 'string' 
                  ? JSON.parse(data.delimiter_config) 
                  : data.delimiter_config;
              } catch {}
            }

            return {
              id: data.platform_id || d.id,
              name: data.name || d.id,
              subtitle: data.subtitle || '',
              tag: data.tag || data.name,
              icon: data.icon || 'facebook',
              color: data.color || '#38bdf8',
              collectionId: data.collection_id || data.platform_id || d.id,
              demoPrice: Number(data.demo_price || 1500),
              delimiterConfig,
              delimiter_config: data.delimiter_config,
              has2fa: Boolean(data.has_2fa),
              isActive: data.is_active !== false,
              items: items.map(item => ({
                ...item,
                platform: item.platform || data.name,
                has2fa: item.has2fa !== undefined ? Boolean(item.has2fa) : (item.has_2fa !== undefined ? Boolean(item.has_2fa) : false),
                price: Number(item.price !== undefined ? item.price : (data.demo_price || 1500))
              }))
            };
          })
          .filter(p => p.isActive);

        if (platforms.length > 0) {
          memoryCache = platforms;
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(platforms));
          } catch {}
          return platforms;
        }
      }
    } catch (err) {
      console.warn('Error fetching dynamic platforms from Firebase Firestore, checking local cache:', err.message);
    }
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('platforms-updated', { detail: { platformId } }));
  }
}

/**
 * Create a new platform category in Google Firebase Firestore.
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

  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.platforms_catalog, cleanId);
    const payload = {
      platform_id: cleanId,
      name: name.trim(),
      subtitle: subtitle || '',
      tag: tag || name.trim(),
      icon: icon || 'generic_globe',
      color: color || '#38bdf8',
      collection_id: cleanId,
      demo_price: Number(demoPrice || 1500),
      packages_json: JSON.stringify(packages || []),
      has_2fa: Boolean(has2fa),
      is_active: true,
      created_at: serverTimestamp()
    };

    await setDoc(docRef, payload, { merge: true });
    invalidateCache(cleanId);
    return { success: true, platformId: cleanId, ...payload };
  } catch (err) {
    console.error('Failed to create platform in Firebase:', err);
    throw err;
  }
}

/**
 * Update an existing platform category (name, subtitle, tag, icon, color, base price)
 */
export async function updatePlatform(platformId, updates = {}) {
  if (!platformId) throw new Error('Platform ID is required.');
  if (!db) throw new Error('Firestore is not initialized.');

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.platforms_catalog, platformId);
    const payload = {
      updated_at: serverTimestamp()
    };

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
      payload.delimiter_config = typeof updates.delimiter_config === 'string' 
        ? updates.delimiter_config 
        : JSON.stringify(updates.delimiter_config);
    }
    if (updates.packages_json !== undefined) {
      payload.packages_json = typeof updates.packages_json === 'string'
        ? updates.packages_json
        : JSON.stringify(updates.packages_json);
    }

    await setDoc(docRef, payload, { merge: true });
    invalidateCache(platformId);
    return { success: true, platformId, updated: payload };
  } catch (dbErr) {
    console.error('Firebase update_platform failed:', dbErr);
    throw dbErr;
  }
}

/**
 * Delete a platform from the catalog (supports ANY platform, including defaults).
 */
export async function deletePlatform(platformId) {
  if (!platformId) throw new Error('Platform ID is required.');
  if (!db) throw new Error('Firestore is not initialized.');

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.platforms_catalog, platformId);
    // Mark as inactive in Firestore
    await setDoc(docRef, { is_active: false, updated_at: serverTimestamp() }, { merge: true });
    invalidateCache(platformId);
    return { success: true, platformId };
  } catch (err) {
    console.error('Delete platform error in Firebase:', err);
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
  if (!db) throw new Error('Firestore is not initialized.');

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.platforms_catalog, platformId);
    const snap = await getDoc(docRef);

    let currentPackages = [];
    let platformName = platformId;
    let demoPrice = 1500;

    if (snap.exists()) {
      const data = snap.data();
      platformName = data.name || platformId;
      demoPrice = data.demo_price || 1500;
      try {
        currentPackages = typeof data.packages_json === 'string'
          ? JSON.parse(data.packages_json || '[]')
          : (data.packages_json || []);
      } catch {
        currentPackages = [];
      }
    }

    const pkgId = packageData.id || `${platformId}-type-${Date.now()}`;
    const newPkg = {
      id: pkgId,
      title: packageData.title.trim(),
      platform: packageData.platform || platformName,
      price: Number(packageData.price !== undefined ? packageData.price : demoPrice),
      description: packageData.description ? packageData.description.trim() : '',
      has2fa: Boolean(packageData.has2fa ?? packageData.has_2fa ?? false)
    };

    currentPackages.push(newPkg);

    await setDoc(docRef, {
      packages_json: JSON.stringify(currentPackages),
      updated_at: serverTimestamp()
    }, { merge: true });

    invalidateCache(platformId);
    return { success: true, platformId, package: newPkg, packages: currentPackages };
  } catch (err) {
    console.error('Firebase add_platform_package failed:', err);
    throw err;
  }
}

/**
 * Update an existing product package within a platform.
 */
export async function updateProductPackage(platformId, packageId, updates) {
  if (!platformId || !packageId) {
    throw new Error('Platform ID and Package ID are required.');
  }
  if (!db) throw new Error('Firestore is not initialized.');

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.platforms_catalog, platformId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error(`Platform ${platformId} not found.`);
    }

    const data = snap.data();
    let currentPackages = [];
    try {
      currentPackages = typeof data.packages_json === 'string'
        ? JSON.parse(data.packages_json || '[]')
        : (data.packages_json || []);
    } catch {
      currentPackages = [];
    }

    const pkgIndex = currentPackages.findIndex(p => p.id === packageId);
    if (pkgIndex < 0) {
      throw new Error(`Package ${packageId} not found on platform.`);
    }

    currentPackages[pkgIndex] = {
      ...currentPackages[pkgIndex],
      title: updates.title !== undefined ? updates.title.trim() : currentPackages[pkgIndex].title,
      price: updates.price !== undefined ? Number(updates.price) : currentPackages[pkgIndex].price,
      description: updates.description !== undefined ? updates.description.trim() : (currentPackages[pkgIndex].description || ''),
      has2fa: updates.has2fa !== undefined ? Boolean(updates.has2fa) : (updates.has_2fa !== undefined ? Boolean(updates.has_2fa) : Boolean(currentPackages[pkgIndex].has2fa ?? currentPackages[pkgIndex].has_2fa ?? false))
    };

    await setDoc(docRef, {
      packages_json: JSON.stringify(currentPackages),
      updated_at: serverTimestamp()
    }, { merge: true });

    invalidateCache(platformId);
    return { success: true, platformId, packageId, package: currentPackages[pkgIndex] };
  } catch (err) {
    console.error('Firebase update_platform_package failed:', err);
    throw err;
  }
}

/**
 * Delete a product package from a platform.
 */
export async function deleteProductPackage(platformId, packageId) {
  if (!platformId || !packageId) {
    throw new Error('Platform ID and Package ID are required.');
  }
  if (!db) throw new Error('Firestore is not initialized.');

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.platforms_catalog, platformId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error(`Platform ${platformId} not found.`);
    }

    const data = snap.data();
    let currentPackages = [];
    try {
      currentPackages = typeof data.packages_json === 'string'
        ? JSON.parse(data.packages_json || '[]')
        : (data.packages_json || []);
    } catch {
      currentPackages = [];
    }

    currentPackages = currentPackages.filter(p => p.id !== packageId);

    await setDoc(docRef, {
      packages_json: JSON.stringify(currentPackages),
      updated_at: serverTimestamp()
    }, { merge: true });

    invalidateCache(platformId);
    return { success: true, platformId, packageId };
  } catch (err) {
    console.error('Firebase delete_platform_package failed:', err);
    throw err;
  }
}
