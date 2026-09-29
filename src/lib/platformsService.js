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
          items: items.map(item => ({
            ...item,
            platform: item.platform || doc.name,
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
  packages
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
        packages: packages || []
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
      } else if (result.error) {
        throw new Error(result.error);
      }
    }

    throw new Error('Failed to update platform.');
  } catch (err) {
    console.error('Update platform error:', err);
    throw err;
  }
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
      } else if (result.error) {
        throw new Error(result.error);
      }
    }

    throw new Error('Failed to add product package to platform.');
  } catch (err) {
    console.error('Add package error:', err);
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
      } else if (result.error) {
        throw new Error(result.error);
      }
    }

    throw new Error('Failed to update product package.');
  } catch (err) {
    console.error('Update package error:', err);
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
