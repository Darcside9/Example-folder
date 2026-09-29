// ==========================================================================
// CHRIS SHOPPER — APPWRITE CLOUD CLIENT CONFIGURATION
// Zero-trust integration with Appwrite Cloud (EU Frankfurt Region)
// ==========================================================================

import { Client, Account, Databases, Functions, Query, ID, Permission, Role } from 'appwrite';

export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '6ab96624002e549083d1',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '6ab96f3c0031c3231183',
  collections: {
    facebook: '6ab9702e001dc7115654',
    tiktok: '6ab97045000451688a63',
    instagram: '6ab9704e00116f8d983c',
    twitter: '6ab9706a003a134738d5',
    textplus: '6ab9707300032f996f8c',
    products_pricing: 'products_pricing',
    user_profiles: 'user_profiles',
    orders: 'orders'
  },
  functionId: 'log-dispenser'
};

export const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export { Query, ID, Permission, Role };
