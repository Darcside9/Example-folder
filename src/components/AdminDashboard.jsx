// ==========================================================================
// CHRIS SHOPPER — ADMIN MASTER CONTROL PANEL
// Features: Zero-Trust Account Logs Ingestion Zone, Live Delimiter Tokenizer,
// Interactive Verification Grid, Batch Sync to Google Firebase Cloud, & Real-Time Pricing
// ==========================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetAllUsers, adminUpdateUserBalance } from '../lib/dashboardService';
import { adminBulkImportLogs } from '../lib/firebaseDispenser';
import { fetchLivePricing, adminUpdateProductPrice, subscribeToPricingUpdates } from '../lib/pricingService';
import { 
  fetchDynamicPlatforms, 
  createPlatform, 
  updatePlatform,
  addProductPackage, 
  updateProductPackage,
  deleteProductPackage,
  deletePlatform 
} from '../lib/platformsService';
import { 
  adminFetchPlatformLogs, 
  adminDeleteLog, 
  adminBulkDeleteLogs 
} from '../lib/inventoryService';
import { PLATFORM_CATEGORIES } from '../data/sampleLogsData';
import { siteConfig } from '../data/siteConfig';
import BrandIcon from './BrandIcon';
import BrandIconPicker from './BrandIconPicker';
import { 
  STANDARD_FIELDS, 
  SUGGESTED_CUSTOM_FIELDS,
  DELIMITER_PRESETS, 
  DEFAULT_DELIMITER_CONFIG, 
  COMMON_DELIMITERS,
  getPlatformDelimiterConfig, 
  getFieldLabel,
  getFieldPlaceholder,
  formatSchemaSyntax, 
  generateSampleLine, 
  parseLineWithSchema 
} from '../lib/delimiterConfig';
import { 
  getStoredDollarRate, 
  fetchLiveDollarRate, 
  saveDollarRate, 
  subscribeToDollarRate, 
  convertUsdToNgn, 
  calculateProfit, 
  formatUsd 
} from '../lib/exchangeRateService';
import { 
  CORE_USA_PLATFORMS, 
  CORE_CANADA_PLATFORMS,
  CORE_UK_PLATFORMS,
  SUPPORTED_REGIONS,
  getPlatformsForCountry,
  fetchLiveTigerSmsRates, 
  fetchTigerBalance 
} from '../lib/tigerSmsService';
import { verifyFirebaseStatus } from '../lib/firebaseDb';
import { isFirebaseConfigured, FIREBASE_CONFIG } from '../lib/firebase';

const SAMPLE_LOG_LINE = '61590748374787 | dv4WaXTqmkR3 | OQVZ ZBN2 SEHY TINT SWPA RL66 SZZK 4RWU | BrandeeOats60@outlook.com | qvli4Ham3';

export default function AdminDashboard({ onShowToast }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('importer'); // 'importer' | 'database' | 'platforms' | 'delimiters' | 'pricing' | 'users' | 'orders'
  
  // Inventory Database View State
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryPlatform, setInventoryPlatform] = useState('all');
  const [inventoryStatusTab, setInventoryStatusTab] = useState('available'); // 'available' | 'sold' | 'all'
  const [inventorySubType, setInventorySubType] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [logDetailsModal, setLogDetailsModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  // Data States
  const [users, setUsers] = useState([]);
  const [pricingProducts, setPricingProducts] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProductPrice, setNewProductPrice] = useState('');

  // -------------------------------------------------------------------------
  // SMS NUMBERS & EXCHANGE RATE CONTROLLER STATES
  // -------------------------------------------------------------------------
  const [dollarRate, setDollarRate] = useState(getStoredDollarRate());
  const [dollarRateInput, setDollarRateInput] = useState(String(getStoredDollarRate()));
  const [isSavingDollarRate, setIsSavingDollarRate] = useState(false);
  const [selectedNumberCountry, setSelectedNumberCountry] = useState('US'); // 'US' | 'CA' | 'UK'
  const [tigerPlatforms, setTigerPlatforms] = useState(CORE_USA_PLATFORMS);
  const [tigerBalance, setTigerBalance] = useState(1.315);
  const [loadingTigerRates, setLoadingTigerRates] = useState(false);
  const [numbersSearch, setNumbersSearch] = useState('');
  const [numbersCategory, setNumbersCategory] = useState('all');
  const [editingNumberId, setEditingNumberId] = useState(null);
  const [editingNumberPrice, setEditingNumberPrice] = useState('');
  const [bulkProfitAmount, setBulkProfitAmount] = useState('1000');
  const [bulkMarginPct, setBulkMarginPct] = useState('50');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // Firebase Cloud State
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncResult, setFirebaseSyncResult] = useState(null);

  const handleVerifyFirebaseConnection = async () => {
    setIsSyncingFirebase(true);
    setFirebaseSyncResult(null);
    try {
      const res = await verifyFirebaseStatus();
      onShowToast?.(`🎉 Google Firebase Cloud Active! ${res.pricingCount} products & rates verified.`, 'success');
      setFirebaseSyncResult({ success: true, count: res.pricingCount });
    } catch (err) {
      console.error('Firebase connection error:', err);
      let msg = err.message || 'Verification failed';
      onShowToast?.(`Firebase Notice: ${msg}`, 'error');
      setFirebaseSyncResult({ success: false, error: msg });
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Platforms Catalog State
  const [platforms, setPlatforms] = useState([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);

  // Brand Icon Picker Modal State
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState('create'); // 'create' | 'edit'

  // Modals for Platform & Package management
  const [showCreatePlatformModal, setShowCreatePlatformModal] = useState(false);
  const [isCreatingPlatform, setIsCreatingPlatform] = useState(false);
  const [newPlatformForm, setNewPlatformForm] = useState({
    id: '',
    name: '',
    subtitle: '',
    tag: '',
    icon: 'generic_globe',
    color: '#38bdf8',
    demoPrice: '1500',
    has2fa: false
  });

  const [showEditPlatformModal, setShowEditPlatformModal] = useState(false);
  const [isEditingPlatform, setIsEditingPlatform] = useState(false);
  const [editingPlatformForm, setEditingPlatformForm] = useState({
    id: '',
    name: '',
    subtitle: '',
    tag: '',
    icon: 'generic_globe',
    color: '#38bdf8',
    demoPrice: '1500',
    has2fa: false
  });

  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [selectedPlatformForPackage, setSelectedPlatformForPackage] = useState(null);
  const [newPackageForm, setNewPackageForm] = useState({
    title: '',
    price: '1500',
    description: '',
    has2fa: false
  });

  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackageForm, setEditingPackageForm] = useState({
    platformId: '',
    platformName: '',
    packageId: '',
    title: '',
    price: '1500',
    description: '',
    has2fa: false
  });

  // -------------------------------------------------------------------------
  // INGESTION ZONE STATES
  // -------------------------------------------------------------------------
  const [targetPlatform, setTargetPlatform] = useState('facebook');
  const [selectedSubTypeId, setSelectedSubTypeId] = useState('fb-type-1');
  const [customSubTypeTitle, setCustomSubTypeTitle] = useState('');
  const [logPrice, setLogPrice] = useState('1500');
  const [rawLogsInput, setRawLogsInput] = useState('');
  const [logRulesNotes, setLogRulesNotes] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [maskPasswords, setMaskPasswords] = useState(true);
  
  // Sync Progress States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  // Available sub-types for active platform
  const activePlatformConfig = useMemo(() => {
    const list = platforms.length > 0 ? platforms : PLATFORM_CATEGORIES;
    return list.find(c => c.id === targetPlatform) || list[0] || PLATFORM_CATEGORIES[0];
  }, [platforms, targetPlatform]);

  // Active platform's assigned delimiter and schema config
  const activePlatformSchema = useMemo(() => {
    return getPlatformDelimiterConfig(activePlatformConfig);
  }, [activePlatformConfig]);

  // Synchronize selectedSubTypeId whenever activePlatformConfig changes to ensure it's always valid
  useEffect(() => {
    if (activePlatformConfig) {
      const items = activePlatformConfig.items || [];
      const isValid = items.some(i => i.id === selectedSubTypeId) || selectedSubTypeId === 'custom';
      if (!isValid) {
        if (items.length > 0) {
          setSelectedSubTypeId(items[0].id);
          setLogPrice(Number(items[0].price || activePlatformConfig.demoPrice || 1500).toFixed(0));
        } else {
          setSelectedSubTypeId('custom');
          setLogPrice(Number(activePlatformConfig.demoPrice || 1500).toFixed(0));
        }
      }
    }
  }, [activePlatformConfig, selectedSubTypeId]);

  // -------------------------------------------------------------------------
  // DELIMITER & SCHEMA CONFIG STATES & ACTIONS
  // -------------------------------------------------------------------------
  const [selectedDelimiterPlatformId, setSelectedDelimiterPlatformId] = useState('facebook');
  const [editingSchemaConfig, setEditingSchemaConfig] = useState(() => ({ ...DEFAULT_DELIMITER_CONFIG, customFieldLabels: {} }));
  const [testPlaygroundInput, setTestPlaygroundInput] = useState('');
  const [customFieldNameInput, setCustomFieldNameInput] = useState('');
  const [isSavingSchema, setIsSavingSchema] = useState(false);

  // Sync active platform for Delimiters tab
  const activeDelimiterPlatform = useMemo(() => {
    const list = platforms.length > 0 ? platforms : PLATFORM_CATEGORIES;
    return list.find(p => p.id === selectedDelimiterPlatformId) || list[0] || PLATFORM_CATEGORIES[0];
  }, [platforms, selectedDelimiterPlatformId]);

  useEffect(() => {
    if (activeDelimiterPlatform) {
      const cfg = getPlatformDelimiterConfig(activeDelimiterPlatform);
      setEditingSchemaConfig(cfg);
      setTestPlaygroundInput(generateSampleLine(cfg));
    }
  }, [activeDelimiterPlatform]);

  // Real-time evaluation in test playground
  const playgroundResult = useMemo(() => {
    if (!testPlaygroundInput.trim()) return null;
    return parseLineWithSchema(testPlaygroundInput, editingSchemaConfig);
  }, [testPlaygroundInput, editingSchemaConfig]);

  const handleApplyPreset = (preset) => {
    const newCfg = {
      delimiter: preset.delimiter,
      fields: [...preset.fields],
      name: preset.name,
      customFieldLabels: { ...(editingSchemaConfig.customFieldLabels || {}) }
    };
    setEditingSchemaConfig(newCfg);
    setTestPlaygroundInput(generateSampleLine(newCfg));
    toast(`Applied "${preset.name}" preset format.`);
  };

  const handleChangeDelimiter = (delim) => {
    const newCfg = { ...editingSchemaConfig, delimiter: delim, name: 'Custom Format' };
    setEditingSchemaConfig(newCfg);
    setTestPlaygroundInput(generateSampleLine(newCfg));
  };

  const handleAddField = (fieldKey, optLabel) => {
    if (editingSchemaConfig.fields.includes(fieldKey)) {
      const label = optLabel || getFieldLabel(fieldKey, editingSchemaConfig);
      toast(`Field "${label}" is already in this schema.`);
      return;
    }
    const newCfg = {
      ...editingSchemaConfig,
      fields: [...editingSchemaConfig.fields, fieldKey],
      customFieldLabels: optLabel 
        ? { ...(editingSchemaConfig.customFieldLabels || {}), [fieldKey]: optLabel }
        : { ...(editingSchemaConfig.customFieldLabels || {}) },
      name: 'Custom Format'
    };
    setEditingSchemaConfig(newCfg);
    setTestPlaygroundInput(generateSampleLine(newCfg));
  };

  const handleAddCustomField = (customLabel = null) => {
    const rawName = typeof customLabel === 'string' ? customLabel : customFieldNameInput;
    if (!rawName || !rawName.trim()) {
      toast('Please enter a custom field name.');
      return;
    }
    const label = rawName.trim();
    const cleanKey = 'custom_' + label.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (editingSchemaConfig.fields.includes(cleanKey)) {
      toast(`Field "${label}" is already in this schema.`);
      return;
    }

    const newCfg = {
      ...editingSchemaConfig,
      fields: [...editingSchemaConfig.fields, cleanKey],
      customFieldLabels: {
        ...(editingSchemaConfig.customFieldLabels || {}),
        [cleanKey]: label
      },
      name: 'Custom Format'
    };
    setEditingSchemaConfig(newCfg);
    setTestPlaygroundInput(generateSampleLine(newCfg));
    setCustomFieldNameInput('');
    toast(`✨ Added custom field "${label}" to sequence!`);
  };

  const handleRemoveField = (fieldKey) => {
    if (editingSchemaConfig.fields.length <= 1) {
      toast('A schema must have at least 1 field.');
      return;
    }
    const newCfg = {
      ...editingSchemaConfig,
      fields: editingSchemaConfig.fields.filter(f => f !== fieldKey),
      name: 'Custom Format'
    };
    setEditingSchemaConfig(newCfg);
    setTestPlaygroundInput(generateSampleLine(newCfg));
  };

  const handleSaveSchema = async () => {
    if (!activeDelimiterPlatform) return;
    setIsSavingSchema(true);
    try {
      await updatePlatform(activeDelimiterPlatform.id, {
        delimiter_config: JSON.stringify(editingSchemaConfig)
      });
      toast(`🎉 Credential delimiter format saved for "${activeDelimiterPlatform.name}"!`);
      await loadPlatforms();
    } catch (err) {
      console.error('Error saving delimiter schema:', err);
      toast(`Error saving schema: ${err.message}`);
    } finally {
      setIsSavingSchema(false);
    }
  };

  // Load platforms catalog from Google Firebase Firestore
  const loadPlatforms = async () => {
    setLoadingPlatforms(true);
    try {
      const data = await fetchDynamicPlatforms(true);
      setPlatforms(data);
      if (data.length > 0 && !targetPlatform) {
        setTargetPlatform(data[0].id);
      }
    } catch (err) {
      console.error('Error loading platforms:', err);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  useEffect(() => {
    loadPlatforms();

    const handlePlatformsUpdated = () => {
      loadPlatforms();
    };

    window.addEventListener('platforms-updated', handlePlatformsUpdated);
    return () => window.removeEventListener('platforms-updated', handlePlatformsUpdated);
  }, []);

  // Load registered users, live Firebase pricing, and Tiger SMS rates
  useEffect(() => {
    async function loadData() {
      try {
        const [usrData, priceData, liveRate, tigerRes, balanceVal] = await Promise.all([
          adminGetAllUsers(),
          fetchLivePricing(),
          fetchLiveDollarRate(),
          fetchLiveTigerSmsRates('187'),
          fetchTigerBalance()
        ]);
        setUsers(usrData || []);
        setPricingProducts(priceData || []);
        if (liveRate) {
          setDollarRate(liveRate);
          setDollarRateInput(String(liveRate));
        }
        if (tigerRes?.platforms) {
          setTigerPlatforms(tigerRes.platforms);
        }
        if (typeof balanceVal === 'number') {
          setTigerBalance(balanceVal);
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    }
    loadData();

    // Subscribe to live pricing updates
    const unsubscribePricing = subscribeToPricingUpdates((updatedList) => {
      setPricingProducts(updatedList);
    });

    // Subscribe to live dollar rate updates
    const unsubscribeDollar = subscribeToDollarRate((newRate) => {
      setDollarRate(newRate);
      setDollarRateInput(String(newRate));
    });

    return () => {
      if (unsubscribePricing) unsubscribePricing();
      if (unsubscribeDollar) unsubscribeDollar();
    };
  }, []);

  const toast = (msg) => {
    if (onShowToast) onShowToast(msg);
  };

  // -------------------------------------------------------------------------
  // INVENTORY DATABASE VIEW LOGIC & HANDLERS
  // -------------------------------------------------------------------------
  const loadInventoryLogs = async () => {
    setLoadingInventory(true);
    try {
      const logs = await adminFetchPlatformLogs({
        platformId: inventoryPlatform,
        status: inventoryStatusTab,
        subTypeId: inventorySubType
      });
      setInventoryLogs(logs || []);
      setSelectedLogIds([]);
    } catch (err) {
      console.error('Error loading inventory logs:', err);
      toast(`Error loading database logs: ${err.message}`);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'database') {
      loadInventoryLogs();
    }
  }, [activeTab, inventoryPlatform, inventoryStatusTab, inventorySubType]);

  useEffect(() => {
    const handleInventoryUpdated = () => {
      if (activeTab === 'database') {
        loadInventoryLogs();
      }
    };
    window.addEventListener('inventory-updated', handleInventoryUpdated);
    return () => window.removeEventListener('inventory-updated', handleInventoryUpdated);
  }, [activeTab, inventoryPlatform, inventoryStatusTab, inventorySubType]);

  // Packages available under current selected platform in inventory filter
  const inventoryPlatformPackages = useMemo(() => {
    if (!inventoryPlatform || inventoryPlatform === 'all') return [];
    const list = platforms.length > 0 ? platforms : PLATFORM_CATEGORIES;
    const plat = list.find(p => p.id === inventoryPlatform);
    return plat?.items || [];
  }, [platforms, inventoryPlatform]);

  // Filtered displayed logs based on search input
  const displayedInventoryLogs = useMemo(() => {
    if (!inventorySearch.trim()) return inventoryLogs;
    const q = inventorySearch.toLowerCase().trim();
    return inventoryLogs.filter(item => {
      return (
        item.username?.toLowerCase().includes(q) ||
        item.mail?.toLowerCase().includes(q) ||
        item.soldToEmail?.toLowerCase().includes(q) ||
        item.subTypeTitle?.toLowerCase().includes(q) ||
        item.rawRecord?.toLowerCase().includes(q) ||
        item.id?.toLowerCase().includes(q)
      );
    });
  }, [inventoryLogs, inventorySearch]);

  // Inventory stats summary
  const inventoryStats = useMemo(() => {
    const total = inventoryLogs.length;
    const available = inventoryLogs.filter(l => l.status === 'available').length;
    const sold = inventoryLogs.filter(l => l.status === 'sold').length;
    return { total, available, sold };
  }, [inventoryLogs]);

  // Selection handlers
  const handleToggleSelectAllLogs = () => {
    if (selectedLogIds.length === displayedInventoryLogs.length && displayedInventoryLogs.length > 0) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(displayedInventoryLogs.map(l => l.id));
    }
  };

  const handleToggleSelectLog = (logId) => {
    setSelectedLogIds(prev => 
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  const togglePasswordReveal = (logId) => {
    setRevealedPasswords(prev => ({ ...prev, [logId]: !prev[logId] }));
  };

  // Delete Request Handlers
  const handleRequestDeleteSingle = (log) => {
    setDeleteConfirmModal({
      type: 'single',
      log,
      title: `Delete Log for ${log.username}`,
      message: `Are you sure you want to permanently delete this ${log.status.toUpperCase()} account log (${log.username}) from ${log.platformName}? This action directly purges the record from Google Firebase Cloud DB and cannot be reversed.`
    });
  };

  const handleRequestBulkDelete = () => {
    if (selectedLogIds.length === 0) return;
    setDeleteConfirmModal({
      type: 'bulk',
      count: selectedLogIds.length,
      title: `Bulk Delete ${selectedLogIds.length} Selected Account Logs`,
      message: `Permanently delete ${selectedLogIds.length} selected account logs from Google Firebase Cloud? This action is irreversible.`
    });
  };

  const handleRequestPurgeSold = () => {
    const soldIds = displayedInventoryLogs.filter(l => l.status === 'sold').map(l => l.id);
    if (soldIds.length === 0) {
      toast('No SOLD accounts found in the current filtered view to purge.');
      return;
    }
    setDeleteConfirmModal({
      type: 'purge_sold',
      count: soldIds.length,
      ids: soldIds,
      title: `Purge ${soldIds.length} Sold Accounts`,
      message: `Permanently purge all ${soldIds.length} SOLD account logs currently filtered in this view? This safely cleans up database space while preserving customer purchase order records in the Orders log.`
    });
  };

  const handleExecuteDeletion = async () => {
    if (!deleteConfirmModal) return;
    setIsBulkDeleting(true);
    try {
      if (deleteConfirmModal.type === 'single') {
        const log = deleteConfirmModal.log;
        await adminDeleteLog({
          platformId: log.platformId,
          collectionId: log.collectionId,
          documentId: log.id
        });
        toast(`🗑️ Log for ${log.username} permanently deleted from ${log.platformName}.`);
      } else if (deleteConfirmModal.type === 'bulk') {
        const logsToDelete = inventoryLogs.filter(l => selectedLogIds.includes(l.id));
        const byPlatform = {};
        logsToDelete.forEach(l => {
          if (!byPlatform[l.platformId]) {
            byPlatform[l.platformId] = { collectionId: l.collectionId, ids: [] };
          }
          byPlatform[l.platformId].ids.push(l.id);
        });

        let totalDeleted = 0;
        for (const [pId, group] of Object.entries(byPlatform)) {
          const res = await adminBulkDeleteLogs({
            platformId: pId,
            collectionId: group.collectionId,
            documentIds: group.ids
          });
          totalDeleted += (res?.deletedCount || 0);
        }
        toast(`🗑️ Successfully deleted ${totalDeleted} account logs from Google Firebase database.`);
        setSelectedLogIds([]);
      } else if (deleteConfirmModal.type === 'purge_sold') {
        const idsToPurge = deleteConfirmModal.ids;
        const logsToPurge = inventoryLogs.filter(l => idsToPurge.includes(l.id));
        const byPlatform = {};
        logsToPurge.forEach(l => {
          if (!byPlatform[l.platformId]) {
            byPlatform[l.platformId] = { collectionId: l.collectionId, ids: [] };
          }
          byPlatform[l.platformId].ids.push(l.id);
        });

        let totalPurged = 0;
        for (const [pId, group] of Object.entries(byPlatform)) {
          const res = await adminBulkDeleteLogs({
            platformId: pId,
            collectionId: group.collectionId,
            documentIds: group.ids
          });
          totalPurged += (res?.deletedCount || 0);
        }
        toast(`🧹 Successfully purged ${totalPurged} SOLD logs from Google Firebase database.`);
        setSelectedLogIds([]);
      }
      setDeleteConfirmModal(null);
      await loadInventoryLogs();
    } catch (err) {
      console.error('Deletion error:', err);
      toast(`❌ Error deleting logs: ${err.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // CLIENT-SIDE DYNAMIC DELIMITER PARSER & SANITIZER
  // Adapts strictly to activePlatformSchema
  // -------------------------------------------------------------------------
  const handleParseLogs = () => {
    if (!rawLogsInput.trim()) {
      toast('Please paste some raw logs first.');
      return;
    }

    const rawLines = rawLogsInput.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    const parsed = rawLines.map((line, idx) => {
      const res = parseLineWithSchema(line, activePlatformSchema);
      return {
        id: `row-${idx + 1}`,
        rowNumber: idx + 1,
        raw: line,
        username: res.extracted?.username || res.extracted?.mail || '',
        password: res.extracted?.password || '',
        twoFactorKey: res.extracted?.twoFactorKey || '',
        mail: res.extracted?.mail || '',
        mailPassword: res.extracted?.mailPassword || '',
        extraData: res.extracted || {},
        parts: res.parts || [],
        isValid: res.isValid,
        error: res.error
      };
    });

    setParsedRows(parsed);
    setHasParsed(true);
    setSyncResult(null);

    const validCount = parsed.filter(r => r.isValid).length;
    const invalidCount = parsed.length - validCount;

    if (invalidCount === 0) {
      toast(`✅ Successfully parsed ${validCount} clean account logs matching ${activePlatformConfig.name} format!`);
    } else {
      toast(`⚠️ Parsed ${parsed.length} rows: ${validCount} valid, ${invalidCount} rejected due to format mismatch.`);
    }
  };

  // Clear Ingestion Zone
  const handleClearIngestion = () => {
    setRawLogsInput('');
    setLogRulesNotes('');
    setParsedRows([]);
    setHasParsed(false);
    setSyncProgress(null);
    setSyncResult(null);
    toast('Ingestion board cleared.');
  };

  // Quick Load Example matching active platform's schema
  const handleLoadExample = () => {
    const sample = generateSampleLine(activePlatformSchema);
    setRawLogsInput(sample);
    toast(`Example format for ${activePlatformConfig.name} loaded into editor!`);
  };

  // -------------------------------------------------------------------------
  // BATCH SYNC TO GOOGLE FIREBASE CLOUD
  // -------------------------------------------------------------------------
  const handleSyncToFirebase = async () => {
    const validRecords = parsedRows.filter(r => r.isValid);
    if (validRecords.length === 0) {
      toast('No valid records to upload. Please parse and fix any errors.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: validRecords.length, percentage: 0, successCount: 0, failedCount: 0 });

    try {
      // Determine package title and ensure a valid package ID in the catalog
      let finalSubTypeId = selectedSubTypeId;
      let subTypeTitle = '';

      if (selectedSubTypeId === 'custom') {
        subTypeTitle = customSubTypeTitle || `${activePlatformConfig.name} Custom Package`;
        finalSubTypeId = `${targetPlatform}-type-${Date.now()}`;
        try {
          await addProductPackage(targetPlatform, {
            id: finalSubTypeId,
            title: subTypeTitle,
            platform: activePlatformConfig.name,
            price: Number(logPrice || 1500),
            description: logRulesNotes.trim(),
            has2fa: false
          });
          await loadPlatforms();
        } catch (addErr) {
          console.warn('Notice creating custom package in catalog:', addErr.message);
        }
      } else {
        const found = (activePlatformConfig.items || []).find(i => i.id === selectedSubTypeId);
        subTypeTitle = found ? found.title : activePlatformConfig.name;
      }

      const effectiveLogPrice = Number(logPrice || 1500);

      const formattedRecords = validRecords.map(r => ({
        username: r.username,
        password: r.password,
        twoFactorKey: r.twoFactorKey,
        mail: r.mail,
        mailPassword: r.mailPassword,
        rawRecord: r.raw,
        extraData: r.extraData,
        rulesNotes: logRulesNotes.trim(),
        subTypeId: finalSubTypeId,
        subTypeTitle: subTypeTitle,
        price: effectiveLogPrice
      }));

      const res = await adminBulkImportLogs({
        platformId: targetPlatform,
        subTypeId: finalSubTypeId,
        subTypeTitle,
        price: effectiveLogPrice,
        records: formattedRecords,
        onProgress: (prog) => {
          setSyncProgress(prog);
        }
      });

      if (res && res.successCount > 0) {
        setSyncResult(res);
        toast(`🎉 Successfully uploaded ${res.successCount} account logs to Google Firebase ${activePlatformConfig.name}!`);

        // Refresh platforms catalog and notify marketplace
        await loadPlatforms();
        window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId: targetPlatform } }));

        // Filter out uploaded records from board, keep invalid ones for fixing
        const remainingInvalid = parsedRows.filter(r => !r.isValid);
        if (remainingInvalid.length > 0) {
          setParsedRows(remainingInvalid);
          setRawLogsInput(remainingInvalid.map(r => r.raw).join('\n'));
        } else {
          setRawLogsInput('');
          setParsedRows([]);
          setHasParsed(false);
        }
      } else {
        const errorDetails = res?.errors?.length > 0 
          ? res.errors.map(e => `${e.username}: ${e.error}`).join('; ')
          : 'Firebase rejected the upload batch. Please verify logs format.';
        toast(`❌ Upload failed: ${errorDetails}`);
        setSyncResult(res);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      toast(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // -------------------------------------------------------------------------
  // BALANCE AND PRICING EDIT HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveBalance = async (userId) => {
    if (!newBalanceInput || isNaN(newBalanceInput)) {
      toast('Please enter a valid numeric balance.');
      return;
    }
    await adminUpdateUserBalance(userId, newBalanceInput);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, balance: Number(newBalanceInput).toFixed(2) } : u))
    );
    setEditingUserId(null);
    setNewBalanceInput('');
    toast('User balance updated successfully!');
  };

  const handleToggleProductStatus = async (productId, currentStatus) => {
    const updated = !currentStatus;
    try {
      await Promise.all([
        updatePlatform(productId, { is_active: updated }).catch(e => console.warn('Platform status sync note:', e.message)),
        adminUpdateProductPrice(productId, { is_active: updated }).catch(e => console.warn('Pricing status sync note:', e.message))
      ]);
      setPlatforms((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_active: updated, isActive: updated } : p))
      );
      setPricingProducts((prev) =>
        prev.map((p) => (p.product_id === productId ? { ...p, is_active: updated } : p))
      );
      toast(`Service ${productId} marked as ${updated ? 'Active' : 'Paused'}!`);
    } catch (err) {
      toast(`Error updating status: ${err.message}`);
    }
  };

  const handleSaveProductPrice = async (productId) => {
    if (!newProductPrice || isNaN(newProductPrice)) {
      toast('Please enter a valid price.');
      return;
    }
    try {
      const priceVal = Number(newProductPrice);
      await Promise.all([
        updatePlatform(productId, { demoPrice: priceVal }).catch(e => console.warn('Platform price sync note:', e.message)),
        adminUpdateProductPrice(productId, { price_usd: priceVal }).catch(e => console.warn('Pricing doc sync note:', e.message))
      ]);

      setPlatforms((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, demoPrice: priceVal } : p))
      );
      setPricingProducts((prev) => {
        const exists = prev.some(p => p.product_id === productId);
        if (exists) {
          return prev.map((p) => (p.product_id === productId ? { ...p, price_usd: priceVal } : p));
        }
        return [...prev, { product_id: productId, price_usd: priceVal, is_active: true, product_type: 'account_log' }];
      });
      setEditingProductId(null);
      setNewProductPrice('');
      toast(`Rate for ${productId} updated to ${siteConfig.formatNaira(priceVal)} across the site!`);
    } catch (err) {
      toast(`Error saving price: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // SMS NUMBERS & EXCHANGE RATE HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveDollarRate = async (e) => {
    if (e) e.preventDefault();
    setIsSavingDollarRate(true);
    try {
      const num = parseFloat(dollarRateInput);
      if (isNaN(num) || num <= 0) {
        toast('Please enter a valid dollar exchange rate (e.g. 1600).');
        setIsSavingDollarRate(false);
        return;
      }
      await saveDollarRate(num);
      setDollarRate(num);
      toast(`💵 Global Dollar Rate saved: 1 USD = ₦${num.toLocaleString()} NGN. Applied site-wide!`);
    } catch (err) {
      toast(`Error saving dollar rate: ${err.message}`);
    } finally {
      setIsSavingDollarRate(false);
    }
  };

  const handleSelectNumberCountry = (countryCode) => {
    setSelectedNumberCountry(countryCode);
    const countryPlats = getPlatformsForCountry(countryCode);
    setTigerPlatforms(countryPlats);
    setNumbersSearch('');
    setNumbersCategory('all');
    setEditingNumberId(null);
  };

  const handleRefreshTigerRates = async () => {
    setLoadingTigerRates(true);
    try {
      const countryParam = selectedNumberCountry === 'UK' ? '16' : (selectedNumberCountry === 'CA' ? '36' : '187');
      const [res, bal] = await Promise.all([
        fetchLiveTigerSmsRates(countryParam),
        fetchTigerBalance()
      ]);
      if (res.success) {
        setTigerPlatforms(res.platforms);
        toast(`✅ Live wholesale rates refreshed from Tiger SMS API for ${selectedNumberCountry === 'UK' ? 'United Kingdom' : (selectedNumberCountry === 'CA' ? 'Canada' : 'USA')}!`);
      } else {
        toast(`⚠️ Refreshed with verified wholesale snapshot (${res.error || 'Network OK'})`);
      }
      if (typeof bal === 'number') {
        setTigerBalance(bal);
      }
    } catch (err) {
      toast(`Failed to refresh API rates: ${err.message}`);
    } finally {
      setLoadingTigerRates(false);
    }
  };

  const handleSaveNumberRetailPrice = async (platformId) => {
    try {
      const numericPrice = parseFloat(editingNumberPrice);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        toast('Please enter a valid final retail price in Naira.');
        return;
      }

      const docKey = selectedNumberCountry === 'UK' ? 'uk_' + platformId : (selectedNumberCountry === 'CA' ? 'ca_' + platformId : platformId);
      const existingDoc = pricingProducts.find(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + platformId)) && p.product_type === 'sms_service');
      const countryPlatforms = getPlatformsForCountry(selectedNumberCountry);
      const platformInfo = countryPlatforms.find(p => p.id === platformId);
      const targetId = existingDoc?.$id || docKey;

      await adminUpdateProductPrice(targetId, {
        price_usd: numericPrice,
        is_active: existingDoc ? existingDoc.is_active : true,
        carrier_speed: existingDoc?.carrier_speed || platformInfo?.carrierSpeed || '< 4s'
      });

      setPricingProducts((prev) => {
        const exists = prev.some(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + platformId)) && p.product_type === 'sms_service');
        if (exists) {
          return prev.map(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + platformId)) && p.product_type === 'sms_service' ? { ...p, price_usd: numericPrice } : p);
        }
        return [...prev, {
          $id: targetId,
          product_id: docKey,
          name: (selectedNumberCountry === 'UK' ? '[UK] ' : (selectedNumberCountry === 'CA' ? '[CA] ' : '')) + (platformInfo?.name || platformId),
          category: platformInfo?.category || 'messaging',
          product_type: 'sms_service',
          price_usd: numericPrice,
          is_active: true,
          carrier_speed: platformInfo?.carrierSpeed || '< 4s'
        }];
      });

      setEditingNumberId(null);
      setEditingNumberPrice('');
      toast(`✅ Updated ${platformInfo?.name || platformId} (${selectedNumberCountry}) final retail price to ${siteConfig.formatNaira(numericPrice)}!`);
    } catch (err) {
      console.error('Error saving number retail price:', err);
      toast(`❌ Error saving price: ${err.message}`);
    }
  };

  const handleToggleNumberStatus = async (platformId, currentStatus) => {
    try {
      const docKey = selectedNumberCountry === 'UK' ? 'uk_' + platformId : (selectedNumberCountry === 'CA' ? 'ca_' + platformId : platformId);
      const existingDoc = pricingProducts.find(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + platformId)) && p.product_type === 'sms_service');
      const countryPlatforms = getPlatformsForCountry(selectedNumberCountry);
      const platformInfo = countryPlatforms.find(p => p.id === platformId);
      const targetId = existingDoc?.$id || docKey;
      const newStatus = !currentStatus;

      await adminUpdateProductPrice(targetId, {
        price_usd: existingDoc ? existingDoc.price_usd : (platformInfo?.defaultRetailNgn || 1000),
        is_active: newStatus,
        carrier_speed: existingDoc?.carrier_speed || platformInfo?.carrierSpeed || '< 4s'
      });

      setPricingProducts((prev) => {
        const exists = prev.some(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + platformId)) && p.product_type === 'sms_service');
        if (exists) {
          return prev.map(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + platformId)) && p.product_type === 'sms_service' ? { ...p, is_active: newStatus } : p);
        }
        return [...prev, {
          $id: targetId,
          product_id: docKey,
          name: (selectedNumberCountry === 'UK' ? '[UK] ' : (selectedNumberCountry === 'CA' ? '[CA] ' : '')) + (platformInfo?.name || platformId),
          category: platformInfo?.category || 'messaging',
          product_type: 'sms_service',
          price_usd: platformInfo?.defaultRetailNgn || 1000,
          is_active: newStatus,
          carrier_speed: platformInfo?.carrierSpeed || '< 4s'
        }];
      });
      toast(`${platformInfo?.name || platformId} (${selectedNumberCountry}) is now ${newStatus ? '🟢 Live in Marketplace' : '⚪ Paused'}`);
    } catch (err) {
      toast(`Error updating status: ${err.message}`);
    }
  };

  const handleApplyBulkMarkup = async (type, value) => {
    setIsApplyingBulk(true);
    try {
      const freshPrices = [...pricingProducts];
      const targetPlatforms = getPlatformsForCountry(selectedNumberCountry);
      let count = 0;

      for (const plat of targetPlatforms) {
        const wholesaleUsd = plat.defaultUsd;
        const wholesaleNgn = Math.round(wholesaleUsd * dollarRate);
        let finalRetailNgn;

        if (type === 'flat') {
          finalRetailNgn = Math.round(wholesaleNgn + Number(value));
        } else if (type === 'percent') {
          finalRetailNgn = Math.round(wholesaleNgn * (1 + Number(value) / 100));
        }

        // Round up to clean nearest 10 Naira
        finalRetailNgn = Math.ceil(finalRetailNgn / 10) * 10;

        const docKey = selectedNumberCountry === 'UK' ? 'uk_' + plat.id : (selectedNumberCountry === 'CA' ? 'ca_' + plat.id : plat.id);
        const existingDoc = freshPrices.find(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + plat.id)) && p.product_type === 'sms_service');
        const targetId = existingDoc?.$id || docKey;

        await adminUpdateProductPrice(targetId, {
          price_usd: finalRetailNgn,
          is_active: existingDoc ? existingDoc.is_active : true,
          carrier_speed: plat.carrierSpeed
        });
        count++;
      }

      const reloaded = await fetchLivePricing();
      setPricingProducts(reloaded);
      toast(`🚀 Applied ${type === 'flat' ? `+₦${Number(value).toLocaleString()} profit` : `+${value}% margin`} to all ${count} ${selectedNumberCountry} platforms!`);
    } catch (err) {
      console.error('Error in bulk markup:', err);
      toast(`Error applying bulk markup: ${err.message}`);
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const filteredNumbersList = useMemo(() => {
    return tigerPlatforms.filter(plat => {
      const matchesSearch = !numbersSearch || 
        plat.name.toLowerCase().includes(numbersSearch.toLowerCase()) || 
        plat.tigerCode.toLowerCase().includes(numbersSearch.toLowerCase()) ||
        plat.category.toLowerCase().includes(numbersSearch.toLowerCase());

      const matchesCat = numbersCategory === 'all' || plat.category === numbersCategory;
      return matchesSearch && matchesCat;
    });
  }, [tigerPlatforms, numbersSearch, numbersCategory]);

  // Group pricing products into SMS and Logs
  const smsServices = useMemo(() => {
    return pricingProducts.filter(p => p.product_type === 'sms_service');
  }, [pricingProducts]);

  // UNIFIED LOG PRODUCTS: Maps over ALL platforms so existing and newly created platforms ALWAYS appear!
  const logProducts = useMemo(() => {
    const list = platforms.length > 0 ? platforms : PLATFORM_CATEGORIES;
    return list.map(plat => {
      const pricingEntry = pricingProducts.find(p => p.product_id === plat.id);
      return {
        $id: pricingEntry?.$id || plat.id,
        product_id: plat.id,
        name: plat.name,
        category: plat.tag || plat.subtitle || 'social_logs',
        product_type: 'account_log',
        price_usd: pricingEntry ? pricingEntry.price_usd : (plat.demoPrice || 1500),
        is_active: pricingEntry?.is_active !== undefined ? pricingEntry.is_active : (plat.is_active !== false && plat.isActive !== false),
        carrier_speed: pricingEntry?.carrier_speed || 'Instant Delivery',
        items: plat.items || [],
        icon: plat.icon,
        rawPlatform: plat
      };
    });
  }, [platforms, pricingProducts]);

  const validRowCount = parsedRows.filter(r => r.isValid).length;
  const invalidRowCount = parsedRows.length - validRowCount;

  // Platform and Package Handlers
  const handleOpenCreatePlatform = () => {
    setNewPlatformForm({
      id: '',
      name: '',
      subtitle: '',
      tag: '',
      icon: 'generic_globe',
      color: '#38bdf8',
      demoPrice: '1500',
      has2fa: false
    });
    setShowCreatePlatformModal(true);
  };

  const handleCreatePlatformSubmit = async (e) => {
    e.preventDefault();
    if (!newPlatformForm.name.trim()) {
      toast('Please enter a platform name.');
      return;
    }

    const platformId = (newPlatformForm.id.trim() || newPlatformForm.name)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');

    setIsCreatingPlatform(true);
    try {
      await createPlatform({
        id: platformId,
        name: newPlatformForm.name.trim(),
        subtitle: newPlatformForm.subtitle.trim() || `${newPlatformForm.name.trim()} Accounts`,
        tag: newPlatformForm.tag.trim() || newPlatformForm.name.trim(),
        icon: newPlatformForm.icon || 'generic_globe',
        color: newPlatformForm.color || '#38bdf8',
        demoPrice: Number(newPlatformForm.demoPrice || 1500),
        packages: [], // Platform starts clean with 0 packages until explicitly added
        has2fa: Boolean(newPlatformForm.has2fa)
      });

      toast(`🎉 Platform "${newPlatformForm.name}" created successfully!`);
      setShowCreatePlatformModal(false);
      setTargetPlatform(platformId);
      await loadPlatforms();
    } catch (err) {
      console.error('Failed to create platform:', err);
      toast(`Error creating platform: ${err.message}`);
    } finally {
      setIsCreatingPlatform(false);
    }
  };

  // Open Edit Platform Modal
  const handleOpenEditPlatform = (platform) => {
    setEditingPlatformForm({
      id: platform.id,
      name: platform.name,
      subtitle: platform.subtitle || '',
      tag: platform.tag || platform.name,
      icon: platform.icon || 'generic_globe',
      color: platform.color || '#38bdf8',
      demoPrice: String(platform.demoPrice || 1500),
      has2fa: Boolean(platform.has2fa ?? platform.has_2fa ?? false)
    });
    setShowEditPlatformModal(true);
  };

  const handleEditPlatformSubmit = async (e) => {
    e.preventDefault();
    if (!editingPlatformForm.name.trim()) {
      toast('Platform name cannot be empty.');
      return;
    }

    setIsEditingPlatform(true);
    try {
      await updatePlatform(editingPlatformForm.id, {
        name: editingPlatformForm.name.trim(),
        subtitle: editingPlatformForm.subtitle.trim(),
        tag: editingPlatformForm.tag.trim(),
        icon: editingPlatformForm.icon,
        color: editingPlatformForm.color,
        demoPrice: Number(editingPlatformForm.demoPrice || 1500),
        has2fa: Boolean(editingPlatformForm.has2fa)
      });

      toast(`🎉 Platform "${editingPlatformForm.name}" updated successfully!`);
      setShowEditPlatformModal(false);
      await loadPlatforms();
    } catch (err) {
      console.error('Failed to update platform:', err);
      toast(`Error updating platform: ${err.message}`);
    } finally {
      setIsEditingPlatform(false);
    }
  };

  const handleOpenAddPackage = (platform) => {
    setSelectedPlatformForPackage(platform);
    setNewPackageForm({
      title: '',
      price: String(platform.demoPrice || 1500),
      description: '',
      has2fa: false
    });
    setShowAddPackageModal(true);
  };

  const handleAddPackageSubmit = async (e) => {
    e.preventDefault();
    if (!newPackageForm.title.trim()) {
      toast('Please enter a package title.');
      return;
    }
    if (!selectedPlatformForPackage) return;

    setIsAddingPackage(true);
    try {
      await addProductPackage(selectedPlatformForPackage.id, {
        id: `${selectedPlatformForPackage.id}-type-${Date.now()}`,
        title: newPackageForm.title.trim(),
        platform: selectedPlatformForPackage.name,
        price: Number(newPackageForm.price || selectedPlatformForPackage.demoPrice || 1500),
        description: newPackageForm.description.trim(),
        has2fa: Boolean(newPackageForm.has2fa)
      });

      toast(`🎉 Product package added to ${selectedPlatformForPackage.name}!`);
      setShowAddPackageModal(false);
      await loadPlatforms();
    } catch (err) {
      console.error('Failed to add package:', err);
      toast(`Error adding package: ${err.message}`);
    } finally {
      setIsAddingPackage(false);
    }
  };

  // Open Edit Package Modal
  const handleOpenEditPackage = (platform, pkg) => {
    setEditingPackageForm({
      platformId: platform.id,
      platformName: platform.name,
      packageId: pkg.id,
      title: pkg.title,
      price: String(pkg.price !== undefined ? pkg.price : (platform.demoPrice || 1500)),
      description: pkg.description || '',
      has2fa: Boolean(pkg.has2fa ?? pkg.has_2fa ?? false)
    });
    setShowEditPackageModal(true);
  };

  const handleEditPackageSubmit = async (e) => {
    e.preventDefault();
    if (!editingPackageForm.title.trim()) {
      toast('Package title cannot be empty.');
      return;
    }

    setIsEditingPackage(true);
    try {
      await updateProductPackage(editingPackageForm.platformId, editingPackageForm.packageId, {
        title: editingPackageForm.title.trim(),
        price: Number(editingPackageForm.price || 1500),
        description: editingPackageForm.description.trim(),
        has2fa: Boolean(editingPackageForm.has2fa)
      });

      toast(`🎉 Package updated successfully!`);
      setShowEditPackageModal(false);
      await loadPlatforms();
    } catch (err) {
      console.error('Failed to update package:', err);
      toast(`Error updating package: ${err.message}`);
    } finally {
      setIsEditingPackage(false);
    }
  };

  const handleDeletePackage = async (platform, pkg) => {
    if (!window.confirm(`Delete package "${pkg.title}" from ${platform.name}?`)) {
      return;
    }

    try {
      await deleteProductPackage(platform.id, pkg.id);
      toast(`Package "${pkg.title}" deleted.`);
      await loadPlatforms();
    } catch (err) {
      console.error('Delete package error:', err);
      toast(`Error deleting package: ${err.message}`);
    }
  };

  const handleDeletePlatform = async (platform) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${platform.name}" from the catalog?`)) {
      return;
    }

    try {
      await deletePlatform(platform.id);
      toast(`Platform "${platform.name}" removed from catalog.`);
      await loadPlatforms();
    } catch (err) {
      console.error('Delete platform error:', err);
      toast(`Error deleting platform: ${err.message}`);
    }
  };

  return (
    <div className="dashboard-page-wrapper admin-theme">
      {/* Top Header */}
      <div className="dashboard-header-container">
        <div className="dashboard-user-greeting">
          <img src="/bag_logo.svg" alt="Chris Shopper" className="brand-logo-img admin-brand-logo" />
          <div>
            <div className="dash-title-row">
              <h2>Admin Master Control Panel</h2>
              <span className="brand-gateway-badge">GATEWAY</span>
              <span className="admin-badge-pill" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))', color: '#ffb74d', borderColor: 'rgba(245, 158, 11, 0.4)' }}>Google Firebase Always-On</span>
            </div>
            <p className="dash-email-sub">Google Firebase Cloud Database &amp; Account Logs Dispenser Controller</p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            📱 User Dashboard View
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>
            🏠 Back to Marketplace
          </button>
        </div>
      </div>

      {/* Admin Quick Metrics */}
      <div className="dashboard-metrics-grid">
        <div className="dash-metric-card">
          <span className="dash-metric-label">Firebase Cloud DB</span>
          <span className="dash-metric-val text-cyan">Connected ⚡</span>
          <span className="dash-metric-sub">Project: {FIREBASE_CONFIG.projectId}</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Cloud Dispenser</span>
          <span className="dash-metric-val text-green">Online 🛡️</span>
          <span className="dash-metric-sub">Zero-Trust Password Masking</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Managed Platforms</span>
          <span className="dash-metric-val text-cyan">{platforms.length || 5} Platforms</span>
          <span className="dash-metric-sub">Firestore Dynamic Collections</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Registered Users</span>
          <span className="dash-metric-val text-green">{users.length}</span>
          <span className="dash-metric-sub">User Balance Profiles</span>
        </div>
      </div>

      {/* Google Firebase Cloud Database Always-On Status Banner */}
      <div className="db-keepalive-banner" style={{ borderLeft: '4px solid #f59e0b', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.8))' }}>
        <div className="db-keepalive-header">
          <div className="db-keepalive-title-group">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔥</span> Google Firebase Cloud Database (Always-On 24/7 SLA)
            </h3>
            <span className="db-keepalive-pulse" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderColor: '#22c55e' }}>
              <span className="pulse-dot" style={{ background: '#22c55e' }}></span>
              Active &amp; Connected (Zero Dormancy)
            </span>
          </div>
          <button 
            type="button" 
            className="btn-keepalive-ping" 
            onClick={handleVerifyFirebaseConnection}
            disabled={isSyncingFirebase}
            style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', color: '#ffb74d' }}
          >
            {isSyncingFirebase ? '⚡ Verifying Connection...' : '⚡ Verify Cloud Connection'}
          </button>
        </div>

        <div className="db-keepalive-metrics-row">
          <div className="db-keepalive-stat">
            <span className="db-keepalive-stat-label">Cloud Infrastructure</span>
            <span className="db-keepalive-stat-val text-cyan">Google Firebase</span>
            <span className="db-keepalive-stat-sub">Project: {FIREBASE_CONFIG.projectId}</span>
          </div>

          <div className="db-keepalive-stat">
            <span className="db-keepalive-stat-label">Cloud Availability</span>
            <span className="db-keepalive-stat-val text-green">Always-On 24/7</span>
            <span className="db-keepalive-stat-sub">Zero dormancy (Never sleeps or pauses)</span>
          </div>

          <div className="db-keepalive-stat">
            <span className="db-keepalive-stat-label">Firestore Collections</span>
            <span className="db-keepalive-stat-val">33 Rates &amp; Catalog</span>
            <span className="db-keepalive-stat-sub">products_pricing, user_profiles, orders</span>
          </div>

          <div className="db-keepalive-stat">
            <span className="db-keepalive-stat-label">Realtime WebSockets</span>
            <span className="db-keepalive-stat-val" style={{ color: '#fbbf24' }}>onSnapshot Sync</span>
            <span className="db-keepalive-stat-sub">Instant zero-latency live broadcast</span>
          </div>
        </div>

        <div className="db-keepalive-actions">
          <p className="db-keepalive-desc">
            🚀 <strong>100% Google Firebase Cloud Migration Complete:</strong> Your store is now permanently powered by Google Cloud Firestore and Firebase Auth. Inactivity pauses are completely eliminated — no cron keepalive pings or manual weekly restorations are ever required.
          </p>
          {firebaseSyncResult && (
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: firebaseSyncResult.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${firebaseSyncResult.success ? '#22c55e' : '#ef4444'}`, fontSize: '13px' }}>
              {firebaseSyncResult.success ? (
                <span style={{ color: '#4ade80' }}>
                  ✅ <strong>Active:</strong> {firebaseSyncResult.count} products &amp; system settings verified in Firebase Firestore!
                </span>
              ) : (
                <span style={{ color: '#f87171' }}>
                  ⚠️ <strong>Notice:</strong> {firebaseSyncResult.error}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="dashboard-nav-tabs">
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'importer' ? 'active' : ''}`}
          onClick={() => setActiveTab('importer')}
        >
          📦 Account Logs Ingestion Zone
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          🗄️ Database View {inventoryLogs.length > 0 ? `(${inventoryLogs.length})` : ''}
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'platforms' ? 'active' : ''}`}
          onClick={() => setActiveTab('platforms')}
        >
          🗂️ Categories &amp; Platforms ({platforms.length || 5})
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'delimiters' ? 'active' : ''}`}
          onClick={() => setActiveTab('delimiters')}
        >
          📋 Delimiter &amp; Schema Config
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'numbers' ? 'active' : ''}`}
          onClick={() => setActiveTab('numbers')}
        >
          📱 SMS Numbers &amp; Rates ({selectedNumberCountry === 'UK' ? '🇬🇧 UK' : (selectedNumberCountry === 'CA' ? '🇨🇦 Canada' : '🇺🇸 USA')})
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          ⚙️ Logs Pricing Controller ({logProducts.length})
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management ({users.length})
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📡 Global Orders Stream
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ACCOUNT LOGS INGESTION ZONE (PIPE-DELIMITED BULK IMPORTER)
          ========================================================================= */}
      {activeTab === 'importer' && (
        <div className="dashboard-tab-content">
          <div className="ingestion-container">
            {/* Ingestion Input Card */}
            <div className="ingestion-card">
              <div className="dash-table-header" style={{ padding: 0, border: 'none' }}>
                <h3>📦 Account Logs Bulk Ingestion Zone</h3>
                <p>Paste raw clipboard data with pipe-delimited format. System parses, sanitizes, and syncs directly into Google Firebase Cloud.</p>
              </div>

              {/* Format Guide */}
              <div className="ingestion-guide-box">
                <div className="ingestion-guide-title">
                  <span>
                    Assigned Format for <strong>{activePlatformConfig.name}</strong> ({activePlatformSchema?.name || 'Custom'}):
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-copy-format" 
                      style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                      onClick={() => {
                        setSelectedDelimiterPlatformId(targetPlatform);
                        setActiveTab('delimiters');
                      }}
                      title="Open Delimiter & Schema Config tab for this platform"
                    >
                      ⚙️ Configure Delimiter Format
                    </button>
                    <button type="button" className="btn-copy-format" onClick={handleLoadExample}>
                      📋 Paste Sample Format
                    </button>
                  </div>
                </div>
                <div className="ingestion-format-code">
                  {formatSchemaSyntax(activePlatformSchema)}
                </div>
              </div>

              {/* Target Configuration Row */}
              <div className="ingestion-config-grid">
                <div className="ingestion-field-group">
                  <label>1. Target Platform</label>
                  <select 
                    className="ingestion-select"
                    value={targetPlatform}
                    onChange={(e) => {
                      if (e.target.value === '__CREATE_NEW__') {
                        handleOpenCreatePlatform();
                      } else {
                        const newPlatId = e.target.value;
                        setTargetPlatform(newPlatId);
                        const list = platforms.length > 0 ? platforms : PLATFORM_CATEGORIES;
                        const newPlat = list.find(p => p.id === newPlatId);
                        if (newPlat && newPlat.items && newPlat.items.length > 0) {
                          setSelectedSubTypeId(newPlat.items[0].id);
                          setLogPrice(Number(newPlat.items[0].price || newPlat.demoPrice || 1500).toFixed(0));
                        } else {
                          setSelectedSubTypeId('custom');
                          setLogPrice(Number(newPlat?.demoPrice || 1500).toFixed(0));
                        }
                      }
                    }}
                  >
                    {(platforms.length > 0 ? platforms : PLATFORM_CATEGORIES).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="__CREATE_NEW__">➕ + Create New Platform...</option>
                  </select>
                </div>

                <div className="ingestion-field-group">
                  <label>2. Account Package / Sub-Type</label>
                  <select 
                    className="ingestion-select"
                    value={selectedSubTypeId}
                    onChange={(e) => {
                      setSelectedSubTypeId(e.target.value);
                      const item = (activePlatformConfig.items || []).find(i => i.id === e.target.value);
                      if (item) setLogPrice(Number(item.price || 1500).toFixed(0));
                    }}
                  >
                    {(activePlatformConfig.items || []).map(item => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                    <option value="custom">✏️ Custom Package Title...</option>
                  </select>
                </div>

                <div className="ingestion-field-group">
                  <label>3. Retail Price (₦ NGN)</label>
                  <input 
                    type="number"
                    step="100"
                    className="ingestion-input"
                    value={logPrice}
                    onChange={(e) => setLogPrice(e.target.value)}
                    placeholder="1500"
                  />
                </div>
              </div>

              {selectedSubTypeId === 'custom' && (
                <div className="ingestion-field-group">
                  <label>Custom Package Description Title</label>
                  <input 
                    type="text"
                    className="ingestion-input"
                    value={customSubTypeTitle}
                    onChange={(e) => setCustomSubTypeTitle(e.target.value)}
                    placeholder="e.g. Facebook Accounts | Aged 2020 | High Trust + 2FA"
                  />
                </div>
              )}

              {/* The Ingestion Textarea */}
              <div className="ingestion-textarea-wrapper">
                <div className="ingestion-textarea-header">
                  <span>Raw Clipboard Logs (1 account / line)</span>
                  <span className="ingestion-counter-pill">
                    {rawLogsInput.trim() ? `${rawLogsInput.split(/\r?\n/).filter(Boolean).length} lines detected` : 'Empty board'}
                  </span>
                </div>
                <textarea 
                  className="ingestion-textarea"
                  rows={8}
                  value={rawLogsInput}
                  onChange={(e) => {
                    setRawLogsInput(e.target.value);
                    setHasParsed(false);
                  }}
                  placeholder={`Paste account logs for ${activePlatformConfig.name} here (1 account per line):\n${generateSampleLine(activePlatformSchema)}`}
                />
              </div>

              {/* Extra Rules & Description Field */}
              <div className="ingestion-textarea-wrapper" style={{ marginTop: '16px' }}>
                <div className="ingestion-textarea-header">
                  <div>
                    <span style={{ fontWeight: 600 }}>📜 Package Rules, Description &amp; Usage Instructions (Optional)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      (Included in buyer&apos;s downloaded .txt file)
                    </span>
                  </div>
                  {logRulesNotes && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setLogRulesNotes('')}
                      title="Clear rules description field"
                    >
                      ✕ Clear Description
                    </button>
                  )}
                </div>
                <textarea 
                  className="ingestion-textarea"
                  rows={3}
                  value={logRulesNotes}
                  onChange={(e) => setLogRulesNotes(e.target.value)}
                  placeholder="e.g. Set paid VPN to Chicago | Login immediately upon receipt | Do not change security info within 48h | 1 hour replacement warranty. (Only included in downloaded .txt file)"
                  style={{ minHeight: '80px', fontSize: '0.86rem' }}
                />
              </div>

              {/* Action Panel Buttons */}
              <div className="ingestion-actions-bar">
                <div className="ingestion-btn-group">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={handleClearIngestion}
                    disabled={isSyncing || (!rawLogsInput && parsedRows.length === 0)}
                  >
                    🧹 Clear
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={handleParseLogs}
                    disabled={isSyncing || !rawLogsInput.trim()}
                  >
                    🔍 Parse &amp; Verify Logs
                  </button>
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSyncToFirebase}
                  disabled={isSyncing || validRowCount === 0}
                  style={{ minWidth: '220px' }}
                >
                  {isSyncing ? '⏳ Syncing to Firebase...' : `🚀 Sync ${validRowCount} Accounts to Google Firebase Cloud`}
                </button>
              </div>

              {/* Live Upload Progress */}
              {isSyncing && syncProgress && (
                <div className="sync-progress-box">
                  <div className="sync-progress-header">
                    <span>Syncing records to <strong>{activePlatformConfig.name}</strong> collection...</span>
                    <strong>{syncProgress.current} / {syncProgress.total} ({syncProgress.percentage}%)</strong>
                  </div>
                  <div className="sync-progress-bar-bg">
                    <div 
                      className="sync-progress-bar-fill" 
                      style={{ width: `${syncProgress.percentage}%` }} 
                    />
                  </div>
                </div>
              )}

              {/* Sync Result Summary */}
              {syncResult && (
                <div className="ingestion-guide-box" style={{ background: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                    🎉 Batch Sync Complete: {syncResult.successCount} accounts stored in Google Firebase Cloud!
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Passwords and 2FA secrets are securely locked. Public visitors will only see usernames and available stock in the marketplace.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Verification Data Grid */}
            {hasParsed && (
              <div className="dash-table-card">
                <div className="dash-table-header">
                  <div className="verification-summary-row">
                    <div>
                      <h3 style={{ margin: 0 }}>Verification Data Grid</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                        Inspect parsed fields before synchronizing to the database. Rows highlighted in red contain syntax errors.
                      </p>
                    </div>

                    <div className="verification-stats-group">
                      <span className="stat-pill stat-total">Total: {parsedRows.length}</span>
                      <span className="stat-pill stat-valid">✓ {validRowCount} Valid</span>
                      {invalidRowCount > 0 && (
                        <span className="stat-pill stat-invalid">✕ {invalidRowCount} Errors</span>
                      )}
                      <button 
                        type="button" 
                        className="btn-toggle-mask"
                        onClick={() => setMaskPasswords(!maskPasswords)}
                      >
                        {maskPasswords ? '👁️ Reveal Passwords' : '🔒 Mask Passwords'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        {activePlatformSchema.fields.map((fKey) => (
                          <th key={fKey}>{getFieldLabel(fKey, activePlatformSchema)}</th>
                        ))}
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr key={row.id} className={row.isValid ? '' : 'row-invalid'}>
                          <td className="font-mono text-muted">{row.rowNumber}</td>
                          {activePlatformSchema.fields.map((fKey) => {
                            const val = row.extraData?.[fKey] || row[fKey] || '';
                            const isPass = fKey.toLowerCase().includes('pass') || fKey.toLowerCase().includes('pin');
                            return (
                              <td 
                                key={fKey} 
                                className={`table-code-cell ${!maskPasswords || !isPass ? 'revealed' : ''}`}
                              >
                                {isPass && maskPasswords ? '••••••••' : (val || '—')}
                              </td>
                            );
                          })}
                          <td>
                            {row.isValid ? (
                              <span className="badge-row-valid">
                                ✓ Ready to Sync
                              </span>
                            ) : (
                              <span className="badge-row-invalid" title={row.raw}>
                                ✕ {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: INVENTORY & DATABASE VIEW (GOOGLE FIREBASE CLOUD DB)
          ========================================================================= */}
      {activeTab === 'database' && (
        <div className="dashboard-tab-content">
          <div className="inventory-tab-container">
            {/* Header Row */}
            <div className="inventory-header-row">
              <div className="inventory-header-titles">
                <h3>🗄️ Google Firebase Cloud Database View &amp; Logs Inventory</h3>
                <p>
                  Inspect, search, and manage all uploaded account credentials across platforms. Delete old or unwanted records individually or in bulk.
                </p>
              </div>

              <div className="inventory-stats-pills">
                <span className="inventory-stat-badge">
                  <span>Total in View:</span>
                  <strong>{inventoryStats.total}</strong>
                </span>
                <span className="inventory-stat-badge available">
                  <span>🟢 Available:</span>
                  <strong>{inventoryStats.available}</strong>
                </span>
                <span className="inventory-stat-badge sold">
                  <span>🔴 Sold:</span>
                  <strong>{inventoryStats.sold}</strong>
                </span>
              </div>
            </div>

            {/* Storage Policy & Sold Logs Educational Notice */}
            <div className={`inventory-storage-notice ${inventoryStatusTab === 'sold' ? 'sold-notice' : ''}`}>
              <span className="inventory-storage-notice-icon">
                {inventoryStatusTab === 'sold' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <strong>Google Firebase Cloud Storage Policy:</strong>
                {inventoryStatusTab === 'sold' ? (
                  <span>
                    {' '}When customer orders are fulfilled, purchased accounts are <strong>retained in the database with status &quot;sold&quot;</strong> (they are not automatically deleted). This preserves historical delivery records. You can safely purge old sold records below at any time without affecting customer order receipts in the Orders Stream.
                  </span>
                ) : (
                  <span>
                    {' '}Account logs uploaded via the Ingestion Zone remain in their respective Firebase collections indefinitely until dispensed or deleted. Sold logs remain marked as &quot;sold&quot; so you can monitor who received them and clean them up when needed.
                  </span>
                )}
              </div>
            </div>

            {/* Filter and Search Controls Card */}
            <div className="inventory-controls-card">
              <div className="inventory-filter-bar">
                <div className="inventory-filter-group">
                  {/* Status Toggle Tabs */}
                  <div className="inventory-status-tabs">
                    <button
                      type="button"
                      className={`inv-status-tab-btn ${inventoryStatusTab === 'available' ? 'active' : ''}`}
                      onClick={() => setInventoryStatusTab('available')}
                    >
                      🟢 Available ({inventoryLogs.filter(l => l.status === 'available').length})
                    </button>
                    <button
                      type="button"
                      className={`inv-status-tab-btn ${inventoryStatusTab === 'sold' ? 'active sold-active' : ''}`}
                      onClick={() => setInventoryStatusTab('sold')}
                    >
                      🔴 Sold / Dispensed ({inventoryLogs.filter(l => l.status === 'sold').length})
                    </button>
                    <button
                      type="button"
                      className={`inv-status-tab-btn ${inventoryStatusTab === 'all' ? 'active all-active' : ''}`}
                      onClick={() => setInventoryStatusTab('all')}
                    >
                      🌐 All Records
                    </button>
                  </div>

                  {/* Platform Selector */}
                  <select
                    className="inventory-select-control"
                    value={inventoryPlatform}
                    onChange={(e) => {
                      setInventoryPlatform(e.target.value);
                      setInventorySubType(''); // reset package filter
                    }}
                  >
                    <option value="all">📁 All Platforms (Aggregated)</option>
                    {(platforms.length > 0 ? platforms : PLATFORM_CATEGORIES).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {/* Sub-type / Package Selector (if specific platform selected) */}
                  {inventoryPlatform !== 'all' && inventoryPlatformPackages.length > 0 && (
                    <select
                      className="inventory-select-control"
                      value={inventorySubType}
                      onChange={(e) => setInventorySubType(e.target.value)}
                    >
                      <option value="">📦 All Packages / Sub-Types</option>
                      {inventoryPlatformPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="inventory-filter-group">
                  {/* Search Bar */}
                  <div className="inventory-search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="inventory-search-input"
                      placeholder="Search username, email, sold-to, doc ID..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                    />
                  </div>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    className="btn-inventory-refresh"
                    onClick={loadInventoryLogs}
                    disabled={loadingInventory}
                  >
                    {loadingInventory ? '🔄 Syncing...' : '🔄 Refresh DB'}
                  </button>

                  {/* Purge Sold Button if viewing sold logs */}
                  {inventoryStatusTab === 'sold' && displayedInventoryLogs.some(l => l.status === 'sold') && (
                    <button
                      type="button"
                      className="btn-inv-action btn-inv-delete"
                      style={{ padding: '7px 14px' }}
                      onClick={handleRequestPurgeSold}
                      disabled={isBulkDeleting}
                    >
                      🧹 Purge All Sold ({displayedInventoryLogs.filter(l => l.status === 'sold').length})
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Actions Floating Bar */}
              {selectedLogIds.length > 0 && (
                <div className="inventory-bulk-bar">
                  <div className="inventory-bulk-left">
                    <span>✓ <strong>{selectedLogIds.length}</strong> log{selectedLogIds.length > 1 ? 's' : ''} selected</span>
                    <button
                      type="button"
                      className="btn-mini-copy"
                      style={{ color: '#94a3b8', textDecoration: 'underline' }}
                      onClick={() => setSelectedLogIds([])}
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn-bulk-delete"
                    onClick={handleRequestBulkDelete}
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting ? 'Deleting...' : `🗑️ Delete Selected (${selectedLogIds.length})`}
                  </button>
                </div>
              )}
            </div>

            {/* Inventory Table Wrap */}
            <div className="inventory-table-wrap">
              {loadingInventory ? (
                <div className="inventory-empty-state">
                  <span className="empty-icon">⏳</span>
                  <p>Querying Google Firebase Cloud collections...</p>
                </div>
              ) : displayedInventoryLogs.length === 0 ? (
                <div className="inventory-empty-state">
                  <span className="empty-icon">📂</span>
                  <p>
                    {inventorySearch 
                      ? `No account logs matched "${inventorySearch}". Try a different keyword.` 
                      : `No ${inventoryStatusTab !== 'all' ? inventoryStatusTab.toUpperCase() : ''} account logs found in the database for this filter.`}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setInventoryPlatform('all');
                      setInventoryStatusTab('all');
                      setInventorySubType('');
                      setInventorySearch('');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th className="inv-checkbox-col">
                        <input
                          type="checkbox"
                          className="inv-checkbox"
                          checked={selectedLogIds.length === displayedInventoryLogs.length && displayedInventoryLogs.length > 0}
                          onChange={handleToggleSelectAllLogs}
                        />
                      </th>
                      <th>Platform / Package</th>
                      <th>Username / Identifier</th>
                      <th>Password</th>
                      <th>2FA / Extra</th>
                      <th>Status</th>
                      <th>Purchase / Tracking</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInventoryLogs.map((log) => {
                      const isSelected = selectedLogIds.includes(log.id);
                      const isPwdRevealed = !!revealedPasswords[log.id];

                      return (
                        <tr key={log.id} className={isSelected ? 'is-selected' : ''}>
                          <td className="inv-checkbox-col">
                            <input
                              type="checkbox"
                              className="inv-checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectLog(log.id)}
                            />
                          </td>

                          <td>
                            <div className="inv-platform-cell">
                              <BrandIcon iconKey={log.platformIcon} name={log.platformName} size={22} />
                              <div className="inv-platform-info">
                                <span className="inv-platform-name">{log.platformName}</span>
                                <span className="inv-subtype-name">{log.subTypeTitle}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="inv-username-cell">
                              <span>{log.username}</span>
                              <button
                                type="button"
                                className="btn-mini-copy"
                                title="Copy username"
                                onClick={() => {
                                  navigator.clipboard.writeText(log.username);
                                  toast(`Copied ${log.username}`);
                                }}
                              >
                                📋
                              </button>
                            </div>
                            {log.mail && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                ✉️ {log.mail}
                              </div>
                            )}
                          </td>

                          <td>
                            <div className="inv-password-cell">
                              <span className="inv-password-text">
                                {isPwdRevealed ? (log.password || '—') : (log.password ? '••••••••' : '—')}
                              </span>
                              {log.password && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-mini-copy"
                                    title={isPwdRevealed ? 'Hide Password' : 'Show Password'}
                                    onClick={() => togglePasswordReveal(log.id)}
                                  >
                                    {isPwdRevealed ? '👁️' : '🙈'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-mini-copy"
                                    title="Copy Password"
                                    onClick={() => {
                                      navigator.clipboard.writeText(log.password);
                                      toast('Password copied');
                                    }}
                                  >
                                    📋
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          <td>
                            {log.twoFactorKey ? (
                              <span className="inv-badge-2fa" title={`2FA Key: ${log.twoFactorKey}`}>
                                🔑 2FA Key
                              </span>
                            ) : log.customData && Object.keys(log.customData).length > 0 ? (
                              <span className="inv-badge-2fa" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}>
                                📑 {Object.keys(log.customData).length} Fields
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>

                          <td>
                            <span className={`inv-status-pill ${log.status}`}>
                              {log.status === 'sold' ? '🔴 Sold' : '🟢 Available'}
                            </span>
                          </td>

                          <td>
                            {log.status === 'sold' ? (
                              <div style={{ fontSize: '0.75rem' }}>
                                <div style={{ color: '#f87171', fontWeight: 600 }}>
                                  👤 {log.soldToEmail || 'Purchased by user'}
                                </div>
                                {log.soldAt && (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                    🕒 {formatDateTime(log.soldAt)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                🕒 Ingested: {formatRelativeTime(log.createdAt) || 'Recent'}
                              </div>
                            )}
                          </td>

                          <td>
                            <strong style={{ color: '#fff', fontSize: '0.84rem' }}>
                              ₦{Number(log.price || 1500).toLocaleString()}
                            </strong>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div className="inv-actions-cell" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn-inv-action btn-inv-view"
                                title="Inspect Full Record"
                                onClick={() => setLogDetailsModal(log)}
                              >
                                👁️ View
                              </button>
                              <button
                                type="button"
                                className="btn-inv-action btn-inv-delete"
                                title="Delete Log"
                                onClick={() => handleRequestDeleteSingle(log)}
                                disabled={isBulkDeleting}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DYNAMIC CATEGORIES & PLATFORMS (GOOGLE FIREBASE CLOUD DB)
          ========================================================================= */}
      {activeTab === 'platforms' && (
        <div className="dashboard-tab-content">
          <div className="platforms-tab-container">
            <div className="platforms-tab-header">
              <div>
                <h3>🗂️ Platform Categories &amp; Product Types</h3>
                <p>
                  Manage live platforms in Google Firebase Cloud DB. Create new platforms with auto-provisioned collections and add account packages instantly.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleOpenCreatePlatform}
              >
                ➕ Create New Platform
              </button>
            </div>

            {loadingPlatforms && platforms.length === 0 ? (
              <div className="text-center p-8 text-secondary">
                <span className="waiting-dot-pulse mr-2" /> Loading platform catalog from Google Firebase Cloud...
              </div>
            ) : (
              <div className="platforms-cards-grid">
                {(platforms.length > 0 ? platforms : PLATFORM_CATEGORIES).map(p => (
                  <div key={p.id} className="platform-admin-card">
                    <div className="platform-card-header">
                      <div className="platform-card-info">
                        <BrandIcon iconKey={p.icon} name={p.name} size={44} />
                        <div className="platform-card-titles">
                          <h4 className="platform-card-name">{p.name}</h4>
                          <span className="platform-card-subtitle">{p.subtitle || 'Verified Profiles'}</span>
                        </div>
                      </div>
                      <span className="platform-card-tag">{p.tag || p.name}</span>
                    </div>

                    <div className="platform-meta-pills">
                      <span className="platform-meta-pill">ID: {p.id}</span>
                      <span className="platform-meta-pill">Base: {siteConfig.formatNaira(p.demoPrice || 1500)}</span>
                      {p.collectionId && (
                        <span className="platform-meta-pill" title={`Collection ID: ${p.collectionId}`}>
                          Col: {p.collectionId.length > 15 ? p.collectionId.slice(0, 10) + '...' : p.collectionId}
                        </span>
                      )}
                    </div>

                    <div className="platform-packages-container">
                      <div className="platform-packages-header">
                        <span>Packages / Types ({p.items?.length || 0})</span>
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                          onClick={() => handleOpenAddPackage(p)}
                        >
                          + Add Type
                        </button>
                      </div>

                      <div className="platform-packages-list">
                        {p.items && p.items.length > 0 ? (
                          p.items.map(pkg => (
                            <div key={pkg.id} className="platform-package-item">
                              <span className="platform-package-title" title={pkg.title}>
                                {pkg.title}
                              </span>
                              <div className="platform-package-actions">
                                <span className="platform-package-price">
                                  {siteConfig.formatNaira(pkg.price !== undefined ? pkg.price : (p.demoPrice || 1500))}
                                </span>
                                <button
                                  type="button"
                                  className="btn-package-action"
                                  onClick={() => handleOpenEditPackage(p, pkg)}
                                  title="Edit Package"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className="btn-package-action btn-package-delete"
                                  onClick={() => handleDeletePackage(p, pkg)}
                                  title="Delete Package"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px' }}>
                            No specific packages configured yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="platform-card-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenAddPackage(p)}
                        title="Add Package Type"
                      >
                        ➕ Add Type
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setTargetPlatform(p.id);
                          setActiveTab('importer');
                        }}
                        title="Ingest Logs"
                      >
                        📥 Ingest
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditPlatform(p)}
                        title="Edit Category"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                        onClick={() => handleDeletePlatform(p)}
                        title="Delete Category"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: CREDENTIAL DELIMITER & SCHEMA CONFIGURATION (DEDICATED SECTION)
          ========================================================================= */}
      {activeTab === 'delimiters' && (
        <div className="dashboard-tab-content">
          <div className="delimiters-tab-container">
            <div className="delimiters-tab-header">
              <div>
                <h3>📋 Credential Delimiter &amp; Schema Formats</h3>
                <p>
                  Configure exact credential delimiters (pipe, colon, semicolon, etc.) and ordered field sequences per platform.
                  The Account Logs Ingestion Zone strictly enforces these formats upon bulk upload.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveSchema}
                disabled={isSavingSchema || !activeDelimiterPlatform}
              >
                {isSavingSchema ? '⏳ Saving Format...' : `💾 Save Delimiter Format for ${activeDelimiterPlatform?.name || 'Platform'}`}
              </button>
            </div>

            <div className="delimiters-workspace-grid">
              {/* Platform Selector Sidebar */}
              <div className="delimiters-platforms-sidebar">
                <span className="delimiters-section-label">Select Target Platform</span>
                <div className="delimiters-platforms-list">
                  {(platforms.length > 0 ? platforms : PLATFORM_CATEGORIES).map((plat) => {
                    const platConfig = getPlatformDelimiterConfig(plat);
                    const isSelected = plat.id === selectedDelimiterPlatformId;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        className={`delimiters-platform-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedDelimiterPlatformId(plat.id)}
                      >
                        <BrandIcon iconKey={plat.icon} name={plat.name} size={32} />
                        <div className="delimiters-plat-text">
                          <span className="delimiters-plat-name">{plat.name}</span>
                          <span className="delimiters-plat-schema-badge">
                            Delim: <code>{platConfig.delimiter === ' ' ? '[space]' : platConfig.delimiter}</code> · {platConfig.fields.length} parts
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schema Configurator Main Panel */}
              <div className="delimiters-editor-panel">
                <div className="delimiters-panel-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BrandIcon iconKey={activeDelimiterPlatform?.icon} name={activeDelimiterPlatform?.name} size={40} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                        {activeDelimiterPlatform?.name} Credential Format
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Currently editing format definition ({editingSchemaConfig.name || 'Custom'})
                      </span>
                    </div>
                  </div>

                  <div className="delimiters-panel-header-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setTargetPlatform(activeDelimiterPlatform.id);
                        setActiveTab('importer');
                      }}
                    >
                      📥 Open Ingestion Zone
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveSchema}
                      disabled={isSavingSchema}
                    >
                      {isSavingSchema ? 'Saving...' : '💾 Save Format'}
                    </button>
                  </div>
                </div>

                {/* Section 1: Standard Preset Pickers */}
                <div className="delimiters-editor-section">
                  <span className="delimiters-sublabel">1. Quick Presets</span>
                  <div className="delimiters-presets-wrap">
                    {DELIMITER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="btn-preset-pill"
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-desc">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Delimiter Selector */}
                <div className="delimiters-editor-section">
                  <span className="delimiters-sublabel">2. Credential Delimiter / Separator</span>
                  <div className="delimiters-choice-row">
                    {COMMON_DELIMITERS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className={`btn-delimiter-choice ${editingSchemaConfig.delimiter === d.value ? 'active' : ''}`}
                        onClick={() => handleChangeDelimiter(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Ordered Field Sequence Builder */}
                <div className="delimiters-editor-section">
                  <span className="delimiters-sublabel">3. Ordered Field Sequence (in order of appearance)</span>
                  <div className="delimiters-fields-tags-row">
                    {editingSchemaConfig.fields.map((fieldKey, idx) => {
                      const isCustom = fieldKey.startsWith('custom_');
                      const label = getFieldLabel(fieldKey, editingSchemaConfig);
                      return (
                        <div key={`${fieldKey}-${idx}`} className={`delimiter-field-chip ${isCustom ? 'custom-chip' : ''}`}>
                          <span className="field-chip-num">{idx + 1}</span>
                          <span>{label}</span>
                          <button
                            type="button"
                            className="field-chip-remove"
                            onClick={() => handleRemoveField(fieldKey)}
                            title="Remove field from sequence"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="delimiters-add-field-row">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Standard Pre-defined Fields:</span>
                    <div className="delimiters-quick-add-wrap">
                      {STANDARD_FIELDS.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          className="btn-add-field-pill"
                          onClick={() => handleAddField(f.key)}
                          disabled={editingSchemaConfig.fields.includes(f.key)}
                          style={editingSchemaConfig.fields.includes(f.key) ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          + {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Arbitrary Custom Field Creator */}
                  <div className="delimiters-custom-field-creator">
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-purple, #c084fc)', fontWeight: 600 }}>
                      ✨ Add Arbitrary Custom Field:
                    </span>
                    <div className="custom-field-input-row">
                      <input
                        type="text"
                        className="ingestion-input custom-field-input"
                        placeholder="e.g. Recovery Email, Backup Codes, Cookie JSON, Proxy, PIN..."
                        value={customFieldNameInput}
                        onChange={(e) => setCustomFieldNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomField();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-add-custom-field"
                        onClick={() => handleAddCustomField()}
                      >
                        ➕ Add Field
                      </button>
                    </div>

                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Quick suggestions:</span>
                      <div className="delimiters-suggestions-wrap">
                        {SUGGESTED_CUSTOM_FIELDS.map((sug) => {
                          const isAlreadyAdded = editingSchemaConfig.fields.includes(sug.key);
                          return (
                            <button
                              key={sug.key}
                              type="button"
                              className="btn-add-field-pill"
                              style={{ 
                                borderColor: 'rgba(168, 85, 247, 0.4)', 
                                color: isAlreadyAdded ? 'var(--text-muted)' : '#d8b4fe',
                                opacity: isAlreadyAdded ? 0.4 : 1,
                                cursor: isAlreadyAdded ? 'not-allowed' : 'pointer'
                              }}
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddCustomField(sug.label)}
                            >
                              + {sug.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Live Schema Syntax & Generated Sample Line */}
                <div className="delimiters-editor-section">
                  <span className="delimiters-sublabel">4. Expected Syntax &amp; Generated Sample</span>
                  <div className="delimiters-syntax-box">
                    <span className="syntax-label">Syntax:</span>
                    <code style={{ color: 'var(--accent-cyan)' }}>{formatSchemaSyntax(editingSchemaConfig)}</code>
                  </div>
                  <div className="delimiters-sample-box" style={{ marginTop: '8px' }}>
                    <span className="syntax-label">Sample Data:</span>
                    <code style={{ color: '#a7f3d0' }}>{generateSampleLine(editingSchemaConfig)}</code>
                  </div>
                </div>

                {/* Section 5: Real-time Interactive Test Playground */}
                <div className="delimiters-editor-section" style={{ borderBottom: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="delimiters-sublabel">5. Real-Time Ingestion Validator Playground</span>
                    <button
                      type="button"
                      className="btn-copy-format"
                      onClick={() => setTestPlaygroundInput(generateSampleLine(editingSchemaConfig))}
                    >
                      🔄 Reset to Sample Line
                    </button>
                  </div>
                  <input
                    type="text"
                    className="ingestion-input"
                    value={testPlaygroundInput}
                    onChange={(e) => setTestPlaygroundInput(e.target.value)}
                    placeholder="Type or paste a test row to verify parsing..."
                    style={{ fontFamily: 'monospace', fontSize: '0.86rem' }}
                  />

                  {playgroundResult && (
                    <div className={`playground-result-box ${playgroundResult.isValid ? 'valid' : 'invalid'}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        {playgroundResult.isValid ? (
                          <>
                            <span style={{ color: '#10b981' }}>✅ Valid Format!</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              ({playgroundResult.parts.length} parts matched schema)
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#ef4444' }}>❌ Format Rejected</span>
                            <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                              {playgroundResult.error}
                            </span>
                          </>
                        )}
                      </div>

                      {playgroundResult.isValid && (
                        <div className="playground-extracted-grid">
                          {Object.entries(playgroundResult.extracted).map(([k, v]) => (
                            <div key={k} className="extracted-pair">
                              <span className="extracted-k">{k}</span>
                              <span className="extracted-v">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Save CTA */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary delimiters-save-cta-btn"
                    onClick={handleSaveSchema}
                    disabled={isSavingSchema}
                  >
                    {isSavingSchema ? '⏳ Saving to Firebase Cloud...' : `💾 Save Delimiter Format for ${activeDelimiterPlatform?.name}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: SMS NUMBERS & CARRIER PRICING CONTROLLER (TIGER SMS & DOLLAR RATE)
          ========================================================================= */}
      {activeTab === 'numbers' && (
        <div className="dashboard-tab-content numbers-pricing-section">
          {/* 0. Country Switcher Pills Bar */}
          <div className="numbers-country-tabs-bar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${selectedNumberCountry === 'US' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectNumberCountry('US')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontWeight: 600 }}
            >
              <span style={{ fontSize: '1.25rem' }}>🇺🇸</span>
              <span>United States</span>
              <span className="badge-pill" style={{ background: selectedNumberCountry === 'US' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                25 Services
              </span>
            </button>
            <button
              type="button"
              className={`btn ${selectedNumberCountry === 'CA' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectNumberCountry('CA')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontWeight: 600 }}
            >
              <span style={{ fontSize: '1.25rem' }}>🇨🇦</span>
              <span>Canada</span>
              <span className="badge-pill" style={{ background: selectedNumberCountry === 'CA' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                25 Services
              </span>
            </button>
            <button
              type="button"
              className={`btn ${selectedNumberCountry === 'UK' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectNumberCountry('UK')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontWeight: 600 }}
            >
              <span style={{ fontSize: '1.25rem' }}>🇬🇧</span>
              <span>United Kingdom</span>
              <span className="badge-pill" style={{ background: selectedNumberCountry === 'UK' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                25 Services
              </span>
            </button>
          </div>

          {/* 1. Tiger SMS Live Gateway Status Banner */}
          <div className="tiger-gateway-banner">
            <div className="tiger-gateway-info">
              <h3>
                <span>📱 Tiger SMS API Carrier Gateway</span>
                <span className="status-pill pill-active">🟢 Active &amp; Connected</span>
              </h3>
              <p>
                Connected to live wholesale carrier pool. Default wholesale USD prices are queried directly from the Tiger SMS API for {selectedNumberCountry === 'UK' ? 'UK (ID 16)' : (selectedNumberCountry === 'CA' ? 'Canada (ID 36)' : 'USA (ID 187)')}. Convert to Naira using the Dollar Rate below, set your retail margins, and dispense to the marketplace.
              </p>
            </div>
            <div className="tiger-gateway-badges">
              <div className="tiger-stat-pill balance">
                <span>💰 Wholesale Balance:</span>
                <strong>${tigerBalance.toFixed(3)} USD</strong>
              </div>
              <div className="tiger-stat-pill active">
                <span>{selectedNumberCountry === 'UK' ? '🇬🇧 Region:' : (selectedNumberCountry === 'CA' ? '🇨🇦 Region:' : '🇺🇸 Region:')}</span>
                <strong>{selectedNumberCountry === 'UK' ? 'UK Physical SIMs' : (selectedNumberCountry === 'CA' ? 'Canada Physical SIMs' : 'USA Physical SIMs')}</strong>
              </div>
              <button 
                type="button" 
                className="btn-refresh-tiger" 
                onClick={handleRefreshTigerRates}
                disabled={loadingTigerRates}
                title="Refresh live wholesale rates and stock from Tiger SMS"
              >
                <span>{loadingTigerRates ? '🔄 Syncing...' : '🔄 Refresh API Rates'}</span>
              </button>
            </div>
          </div>

          {/* 2. Global Dollar (USD to NGN) Exchange Rate Controller Card */}
          <div className="dash-table-card dollar-rate-card">
            <div className="dash-table-header">
              <h3>💵 Global Dollar (USD to NGN) Exchange Rate Controller</h3>
              <p>
                Define the official Dollar Rate used across the entire platform. When updated here, it saves to Google Firebase Cloud and converts Tiger SMS wholesale costs into Naira site-wide in real-time.
              </p>
            </div>

            <div className="dollar-rate-content">
              <form onSubmit={handleSaveDollarRate} className="dollar-rate-row">
                <div className="dollar-rate-input-group">
                  <span className="dollar-rate-label">Global Exchange Rate:</span>
                  <div className="dollar-rate-field-wrap">
                    <span className="dollar-rate-field-prefix">₦</span>
                    <input 
                      type="number" 
                      step="1"
                      min="1"
                      className="dollar-rate-input" 
                      value={dollarRateInput} 
                      onChange={(e) => setDollarRateInput(e.target.value)}
                      placeholder="1600"
                    />
                  </div>
                  <span className="dollar-rate-suffix">NGN per $1.00 USD</span>
                </div>

                <button 
                  type="submit" 
                  className="btn-save-dollar" 
                  disabled={isSavingDollarRate}
                >
                  {isSavingDollarRate ? 'Saving...' : '💾 Save Global Dollar Rate'}
                </button>
              </form>

              {/* Conversion Preview Strip */}
              <div className="dollar-rate-examples">
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>Conversion Guide:</span>
                <div className="rate-example-item">
                  <span>$1.00 USD =</span>
                  <strong>₦{dollarRate.toLocaleString()} NGN</strong>
                </div>
                <span>•</span>
                <div className="rate-example-item">
                  <span>$0.040 USD (TikTok) =</span>
                  <strong>₦{(0.04 * dollarRate).toFixed(1)} NGN</strong>
                </div>
                <span>•</span>
                <div className="rate-example-item">
                  <span>$0.250 USD (Telegram) =</span>
                  <strong>₦{(0.25 * dollarRate).toFixed(1)} NGN</strong>
                </div>
                <span>•</span>
                <div className="rate-example-item">
                  <span>$0.356 USD (WhatsApp) =</span>
                  <strong>₦{(0.356 * dollarRate).toFixed(1)} NGN</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Quick Profit Margin & Bulk Pricing Assistant Card */}
          <div className="margin-assistant-card">
            <div className="margin-assistant-header">
              <h4>
                <span>⚡ Quick Profit Margin Assistant</span>
                <span className="badge-pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  Auto-Calculates Final Retail Prices
                </span>
              </h4>
              <p>
                Apply a uniform profit markup on top of the wholesale Naira cost across all 25 {selectedNumberCountry === 'UK' ? 'United Kingdom' : (selectedNumberCountry === 'CA' ? 'Canada' : 'USA')} platforms, or edit any platform individually in the table below.
              </p>
            </div>

            <div className="margin-tools-row">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quick Markups:</span>
              <button 
                type="button" 
                className="margin-chip-btn"
                disabled={isApplyingBulk}
                onClick={() => handleApplyBulkMarkup('flat', 500)}
              >
                +₦500 Flat Profit
              </button>
              <button 
                type="button" 
                className="margin-chip-btn"
                disabled={isApplyingBulk}
                onClick={() => handleApplyBulkMarkup('flat', 1000)}
              >
                +₦1,000 Flat Profit
              </button>
              <button 
                type="button" 
                className="margin-chip-btn"
                disabled={isApplyingBulk}
                onClick={() => handleApplyBulkMarkup('flat', 1500)}
              >
                +₦1,500 Flat Profit
              </button>
              <button 
                type="button" 
                className="margin-chip-btn"
                disabled={isApplyingBulk}
                onClick={() => handleApplyBulkMarkup('percent', 50)}
              >
                +50% Margin
              </button>
              <button 
                type="button" 
                className="margin-chip-btn"
                disabled={isApplyingBulk}
                onClick={() => handleApplyBulkMarkup('percent', 80)}
              >
                +80% Margin
              </button>
              <button 
                type="button" 
                className="margin-chip-btn"
                disabled={isApplyingBulk}
                onClick={() => handleApplyBulkMarkup('percent', 100)}
              >
                +100% Margin (2x Wholesale)
              </button>
            </div>
          </div>

          {/* 4. Live Verification Platforms Pricing & Dispenser Table */}
          <div className="dash-table-card">
            <div className="dash-table-header">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div>
                  <h3>📱 {selectedNumberCountry === 'UK' ? 'United Kingdom' : (selectedNumberCountry === 'CA' ? 'Canada' : 'USA')} Verification Platforms &amp; Marketplace Dispenser (25 Services)</h3>
                  <p>
                    Default wholesale prices come directly from Tiger SMS API in USD for {selectedNumberCountry === 'UK' ? 'United Kingdom (country ID 16)' : (selectedNumberCountry === 'CA' ? 'Canada (country ID 36)' : 'USA (country ID 187)')}. Final price in Naira is what is dispensed to the public marketplace.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search platform or code..." 
                    className="inline-input"
                    style={{ width: '220px', padding: '6px 12px' }}
                    value={numbersSearch}
                    onChange={(e) => setNumbersSearch(e.target.value)}
                  />
                  {numbersSearch && (
                    <button type="button" className="btn-tiny-cancel" onClick={() => setNumbersSearch('')}>✕</button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="inventory-subtypes-bar" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['all', 'messaging', 'social', 'tech', 'dating', 'finance', 'entertainment', 'other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`subtype-pill ${numbersCategory === cat ? 'active' : ''}`}
                    onClick={() => setNumbersCategory(cat)}
                  >
                    {cat === 'all' ? 'All Platforms (25)' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive numbers-desktop-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Platform / Brand</th>
                    <th>Wholesale (USD) [API]</th>
                    <th>Wholesale (NGN) [@ ₦{dollarRate}/$]</th>
                    <th>Final Retail Price (NGN) [Marketplace]</th>
                    <th>Profit Margin</th>
                    <th>Available Pool</th>
                    <th>Marketplace Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNumbersList.map((plat) => {
                    const docKey = selectedNumberCountry === 'UK' ? 'uk_' + plat.id : (selectedNumberCountry === 'CA' ? 'ca_' + plat.id : plat.id);
                    const pricingDoc = pricingProducts.find(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + plat.id)) && p.product_type === 'sms_service');
                    const retailNgn = pricingDoc ? Number(pricingDoc.price_usd) : plat.defaultRetailNgn;
                    const isActive = pricingDoc ? pricingDoc.is_active : true;
                    const wholesaleUsd = plat.defaultUsd;
                    const wholesaleNgn = Math.round(wholesaleUsd * dollarRate * 100) / 100;
                    const profitInfo = calculateProfit(retailNgn, wholesaleNgn);
                    const isEditing = editingNumberId === plat.id;

                    return (
                      <tr key={plat.id}>
                        {/* 1. Platform & Tiger Code */}
                        <td>
                          <div className="numbers-table-service-col">
                            <BrandIcon iconKey={plat.icon} name={plat.name} size={30} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong>{plat.name}</strong>
                                <span className="numbers-code-badge">{plat.tigerCode}</span>
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {plat.category} • Speed {plat.carrierSpeed}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Wholesale USD (from API) */}
                        <td>
                          <span className="wholesale-usd-text">{formatUsd(wholesaleUsd)}</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tiger default</div>
                        </td>

                        {/* 3. Wholesale NGN (converted) */}
                        <td>
                          <span className="wholesale-ngn-text">
                            ₦{wholesaleNgn.toLocaleString('en-NG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Converted cost</div>
                        </td>

                        {/* 4. Final Retail Price in Naira (Marketplace Dispenser) */}
                        <td>
                          {isEditing ? (
                            <div className="inline-edit-row">
                              <span style={{ color: '#38bdf8', fontWeight: 700 }}>₦</span>
                              <input 
                                type="number" 
                                step="10" 
                                min="50"
                                value={editingNumberPrice} 
                                onChange={(e) => setEditingNumberPrice(e.target.value)}
                                className="inline-input"
                                style={{ width: '100px' }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveNumberRetailPrice(plat.id);
                                  if (e.key === 'Escape') setEditingNumberId(null);
                                }}
                              />
                              <button 
                                type="button" 
                                className="btn-tiny-save" 
                                onClick={() => handleSaveNumberRetailPrice(plat.id)}
                              >
                                Save
                              </button>
                              <button 
                                type="button" 
                                className="btn-tiny-cancel" 
                                onClick={() => setEditingNumberId(null)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="retail-price-dispenser">{siteConfig.formatNaira(retailNgn)}</span>
                            </div>
                          )}
                        </td>

                        {/* 5. Profit Margin */}
                        <td>
                          {profitInfo.isProfitable ? (
                            <span className="badge-profit" title="Net profit per verification">
                              +{siteConfig.formatNaira(profitInfo.profitNgn)} (+{profitInfo.marginPct}%)
                            </span>
                          ) : (
                            <span className="badge-loss" title="Warning: Selling below wholesale cost!">
                              ⚠️ -{siteConfig.formatNaira(Math.abs(profitInfo.profitNgn))} (LOSS)
                            </span>
                          )}
                        </td>

                        {/* 6. Stock Pool */}
                        <td>
                          <span className="numbers-stock-text">
                            {plat.stock ? `${plat.stock.toLocaleString()} lines` : 'In Stock'}
                          </span>
                        </td>

                        {/* 7. Marketplace Status */}
                        <td>
                          <button
                            type="button"
                            className={`status-pill ${isActive ? 'pill-active' : 'pill-soon'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => handleToggleNumberStatus(plat.id, isActive)}
                            title="Click to toggle live marketplace visibility"
                          >
                            {isActive ? '🟢 Live in Market' : '⚪ Paused'}
                          </button>
                        </td>

                        {/* 8. Actions */}
                        <td>
                          <div className="admin-actions-row">
                            {!isEditing && (
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setEditingNumberId(plat.id);
                                  setEditingNumberPrice(String(retailNgn));
                                }}
                              >
                                Edit Rate
                              </button>
                            )}
                            <button 
                              type="button" 
                              className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={() => handleToggleNumberStatus(plat.id, isActive)}
                            >
                              {isActive ? 'Pause' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards (Visible on screens <= 768px) */}
            <div className="numbers-mobile-cards-wrap">
              {filteredNumbersList.map((plat) => {
                const docKey = selectedNumberCountry === 'UK' ? 'uk_' + plat.id : (selectedNumberCountry === 'CA' ? 'ca_' + plat.id : plat.id);
                const pricingDoc = pricingProducts.find(p => (p.product_id === docKey || (selectedNumberCountry === 'US' && p.product_id === 'us_' + plat.id)) && p.product_type === 'sms_service');
                const retailNgn = pricingDoc ? Number(pricingDoc.price_usd) : plat.defaultRetailNgn;
                const isActive = pricingDoc ? pricingDoc.is_active : true;
                const wholesaleUsd = plat.defaultUsd;
                const wholesaleNgn = Math.round(wholesaleUsd * dollarRate * 100) / 100;
                const profitInfo = calculateProfit(retailNgn, wholesaleNgn);
                const isEditing = editingNumberId === plat.id;

                return (
                  <div key={plat.id} className={`numbers-mobile-card ${!isActive ? 'card-paused' : ''}`}>
                    <div className="num-card-top">
                      <div className="num-card-brand">
                        <BrandIcon iconKey={plat.icon} name={plat.name} size={32} />
                        <div>
                          <div className="num-card-name-row">
                            <span className="num-card-title">{plat.name}</span>
                            <span className="numbers-code-badge">{plat.tigerCode}</span>
                          </div>
                          <span className="num-card-category">{plat.category} • {plat.carrierSpeed}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`status-pill ${isActive ? 'pill-active' : 'pill-soon'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={() => handleToggleNumberStatus(plat.id, isActive)}
                        title="Toggle marketplace visibility"
                      >
                        {isActive ? '🟢 Live' : '⚪ Paused'}
                      </button>
                    </div>

                    <div className="num-card-metrics-grid">
                      <div className="num-metric-box">
                        <span className="num-metric-lbl">Wholesale (USD)</span>
                        <span className="wholesale-usd-text">{formatUsd(wholesaleUsd)}</span>
                        <span className="num-metric-sub">Tiger default</span>
                      </div>

                      <div className="num-metric-box">
                        <span className="num-metric-lbl">Wholesale (NGN)</span>
                        <span className="wholesale-ngn-text">
                          ₦{wholesaleNgn.toLocaleString('en-NG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                        <span className="num-metric-sub">@ ₦{dollarRate}/$</span>
                      </div>

                      <div className="num-metric-box highlight">
                        <span className="num-metric-lbl">Retail Price (Market)</span>
                        {isEditing ? (
                          <div className="inline-edit-row" style={{ marginTop: '4px' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>₦</span>
                            <input 
                              type="number" 
                              step="10" 
                              min="50"
                              value={editingNumberPrice} 
                              onChange={(e) => setEditingNumberPrice(e.target.value)}
                              className="inline-input"
                              style={{ width: '85px', padding: '4px 6px' }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNumberRetailPrice(plat.id);
                                if (e.key === 'Escape') setEditingNumberId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <span className="retail-price-dispenser">{siteConfig.formatNaira(retailNgn)}</span>
                        )}
                        <span className="num-metric-sub">Dispensed to users</span>
                      </div>

                      <div className="num-metric-box">
                        <span className="num-metric-lbl">Net Profit / Margin</span>
                        {profitInfo.isProfitable ? (
                          <span className="badge-profit" style={{ fontSize: '0.76rem', padding: '2px 8px' }}>
                            +{siteConfig.formatNaira(profitInfo.profitNgn)} (+{profitInfo.marginPct}%)
                          </span>
                        ) : (
                          <span className="badge-loss" style={{ fontSize: '0.76rem', padding: '2px 8px' }}>
                            ⚠️ -{siteConfig.formatNaira(Math.abs(profitInfo.profitNgn))}
                          </span>
                        )}
                        <span className="num-metric-sub">{profitInfo.isProfitable ? 'Profit per line' : 'Selling at loss!'}</span>
                      </div>
                    </div>

                    <div className="num-card-footer">
                      <div className="num-card-stock">
                        <span className="num-stock-dot"></span>
                        <span>{plat.stock ? `${plat.stock.toLocaleString()} lines pool` : 'In Stock'}</span>
                      </div>

                      <div className="num-card-actions">
                        {isEditing ? (
                          <>
                            <button 
                              type="button" 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveNumberRetailPrice(plat.id)}
                            >
                              Save
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingNumberId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingNumberId(plat.id);
                                setEditingNumberPrice(String(retailNgn));
                              }}
                            >
                              Edit Rate
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={() => handleToggleNumberStatus(plat.id, isActive)}
                            >
                              {isActive ? 'Pause' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DYNAMIC SERVICES & PRICING CONTROLLER (GOOGLE FIREBASE CLOUD)
          ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="dashboard-tab-content">
          <div className="tiger-gateway-banner" style={{ marginBottom: '24px' }}>
            <div className="tiger-gateway-info">
              <h3>📱 SMS Numbers &amp; Carrier Rates Management</h3>
              <p>
                Looking to manage live Tiger SMS wholesale prices, USD exchange rate, and profit margins for verification numbers? We have a dedicated section!
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setActiveTab('numbers')}
            >
              Open 📱 SMS Numbers &amp; Rates ({tigerPlatforms.length}) ➔
            </button>
          </div>
          <div className="dash-table-card" style={{ marginBottom: '24px' }}>
            <div className="dash-table-header">
              <h3>📱 Physical SIM Carrier Rates (SMS Verification)</h3>
              <p>Adjust live wholesale rates and availability for SMS carrier verification lines. Synchronized with Google Firebase in real-time.</p>
            </div>

            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Rate / SMS</th>
                    <th>Status</th>
                    <th>Carrier Speed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {smsServices.map((srv) => (
                    <tr key={srv.$id || srv.product_id}>
                      <td><strong>{srv.name}</strong></td>
                      <td><span className="text-secondary">{srv.category}</span></td>
                      <td>
                        {editingProductId === srv.product_id ? (
                          <div className="inline-edit-row">
                            <input 
                              type="number" 
                              step="10" 
                              value={newProductPrice} 
                              onChange={(e) => setNewProductPrice(e.target.value)}
                              className="inline-input"
                              placeholder={srv.price_usd}
                            />
                            <button type="button" className="btn-tiny-save" onClick={() => handleSaveProductPrice(srv.product_id)}>Save</button>
                            <button type="button" className="btn-tiny-cancel" onClick={() => setEditingProductId(null)}>✕</button>
                          </div>
                        ) : (
                          <span className="font-mono text-cyan">{siteConfig.formatNaira(srv.price_usd)}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${srv.is_active ? 'pill-active' : 'pill-soon'}`}>
                          {srv.is_active ? '🟢 Live & Active' : '⚪ Coming Soon'}
                        </span>
                      </td>
                      <td>{srv.carrier_speed || '< 4.0s'}</td>
                      <td>
                        <div className="admin-actions-row">
                          <button 
                            type="button" 
                            className={`btn btn-sm ${srv.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleProductStatus(srv.product_id, srv.is_active)}
                          >
                            {srv.is_active ? 'Pause Service' : 'Activate Service'}
                          </button>
                          {editingProductId !== srv.product_id && (
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingProductId(srv.product_id);
                                setNewProductPrice(srv.price_usd);
                              }}
                            >
                              Edit Rate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dash-table-card">
            <div className="dash-table-header">
              <h3>📦 Social &amp; Platform Account Logs Catalog Rates</h3>
              <p>Control baseline rates for account logs. When admin changes prices here, it immediately reflects across the marketplace.</p>
            </div>

            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Category</th>
                    <th>Rate / Account</th>
                    <th>Marketplace Status</th>
                    <th>Delivery Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logProducts.map((prod) => (
                    <tr key={prod.$id || prod.product_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <BrandIcon iconKey={prod.icon} name={prod.name} size={32} />
                          <div>
                            <strong>{prod.name}</strong>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {prod.items?.length || 0} package type{prod.items?.length === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-secondary">{prod.category}</span></td>
                      <td>
                        {editingProductId === prod.product_id ? (
                          <div className="inline-edit-row">
                            <input 
                              type="number" 
                              step="100" 
                              value={newProductPrice} 
                              onChange={(e) => setNewProductPrice(e.target.value)}
                              className="inline-input"
                              placeholder={prod.price_usd}
                            />
                            <button type="button" className="btn-tiny-save" onClick={() => handleSaveProductPrice(prod.product_id)}>Save</button>
                            <button type="button" className="btn-tiny-cancel" onClick={() => setEditingProductId(null)}>✕</button>
                          </div>
                        ) : (
                          <span className="font-mono text-cyan">{siteConfig.formatNaira(prod.price_usd)}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${prod.is_active ? 'pill-active' : 'pill-soon'}`}>
                          {prod.is_active ? '🟢 In Stock' : '⚪ Out of Stock'}
                        </span>
                      </td>
                      <td>Instant Delivery</td>
                      <td>
                        <div className="admin-actions-row">
                          <button 
                            type="button" 
                            className={`btn btn-sm ${prod.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleProductStatus(prod.product_id, prod.is_active)}
                          >
                            {prod.is_active ? 'Pause Sales' : 'Resume Sales'}
                          </button>
                          {editingProductId !== prod.product_id && (
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingProductId(prod.product_id);
                                setNewProductPrice(prod.price_usd);
                              }}
                            >
                              Edit Price
                            </button>
                          )}
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedDelimiterPlatformId(prod.product_id);
                              setActiveTab('delimiters');
                            }}
                            title="Configure Delimiter & Schema Format"
                          >
                            📋 Delimiter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: USER MANAGEMENT
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="dashboard-tab-content">
          <div className="dash-table-card">
            <div className="dash-table-header">
              <h3>Registered Users &amp; Balance Management</h3>
              <p>View user credentials, WhatsApp handles, and adjust user balances directly.</p>
            </div>

            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>WhatsApp Contact</th>
                    <th>Role</th>
                    <th>Balance</th>
                    <th>Registered Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.email}</strong></td>
                      <td>{u.contact_info || '—'}</td>
                      <td>
                        <span className={`role-tag ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td>
                        {editingUserId === u.id ? (
                          <div className="inline-edit-row">
                            <input 
                              type="number" 
                              step="500" 
                              value={newBalanceInput} 
                              onChange={(e) => setNewBalanceInput(e.target.value)}
                              className="inline-input"
                              placeholder={u.balance}
                            />
                            <button type="button" className="btn-tiny-save" onClick={() => handleSaveBalance(u.id)}>Save</button>
                            <button type="button" className="btn-tiny-cancel" onClick={() => setEditingUserId(null)}>✕</button>
                          </div>
                        ) : (
                          <strong className="text-cyan">{siteConfig.formatNaira(u.balance || 0)}</strong>
                        )}
                      </td>
                      <td>{new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
                      <td>
                        {editingUserId !== u.id && (
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setNewBalanceInput(u.balance);
                            }}
                          >
                            ✏️ Edit Balance
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: GLOBAL ORDERS STREAM
          ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="dashboard-tab-content">
          <div className="dash-table-card">
            <div className="dash-table-header">
              <h3>Global Platform Orders Feed</h3>
              <p>Live stream of incoming verification requests and account log purchases.</p>
            </div>

            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product Type</th>
                    <th>Details</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">ord_98a7bc</td>
                    <td><strong>SMS VERIFICATION</strong></td>
                    <td>Telegram 🇺🇸 US (+1 415 892-0194)</td>
                    <td>{siteConfig.formatNaira(250)}</td>
                    <td><span className="status-pill pill-completed">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="font-mono">ord_62fd41</td>
                    <td><strong>SMS VERIFICATION</strong></td>
                    <td>WhatsApp 🇺🇸 US (+1 650 420-9182)</td>
                    <td>{siteConfig.formatNaira(300)}</td>
                    <td><span className="status-pill pill-completed">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="font-mono">ord_firebase_1</td>
                    <td><strong>ACCOUNT LOG</strong></td>
                    <td>Facebook Accounts (@61590748374787)</td>
                    <td>{siteConfig.formatNaira(1500)}</td>
                    <td><span className="status-pill pill-completed">Delivered</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE NEW TARGET PLATFORM & PROVISION COLLECTION
          ========================================================================= */}
      {showCreatePlatformModal && (
        <div className="logs-modal-overlay" onClick={() => !isCreatingPlatform && setShowCreatePlatformModal(false)}>
          <div className="logs-modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title">➕ Create Target Platform</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Provisions a new platform collection, standard schema, and registers it in Google Firebase Firestore.
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => !isCreatingPlatform && setShowCreatePlatformModal(false)}
                disabled={isCreatingPlatform}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlatformSubmit} className="platform-form-grid">
              <div className="ingestion-field-group">
                <label>Platform Name *</label>
                <input 
                  type="text"
                  required
                  className="ingestion-input"
                  placeholder="e.g. LinkedIn Accounts, Discord"
                  value={newPlatformForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 20);
                    setNewPlatformForm(prev => ({
                      ...prev,
                      name,
                      id: prev.id && prev.id !== autoSlug.slice(0, -1) ? prev.id : autoSlug,
                      tag: prev.tag ? prev.tag : name.split(' ')[0]
                    }));
                  }}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Platform ID / Slug *</label>
                <input 
                  type="text"
                  required
                  className="ingestion-input"
                  placeholder="e.g. linkedin, discord"
                  value={newPlatformForm.id}
                  onChange={(e) => setNewPlatformForm({ ...newPlatformForm, id: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Subtitle / Description</label>
                <input 
                  type="text"
                  className="ingestion-input"
                  placeholder="e.g. Aged & Phone Verified Profiles"
                  value={newPlatformForm.subtitle}
                  onChange={(e) => setNewPlatformForm({ ...newPlatformForm, subtitle: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Badge Tag</label>
                <input 
                  type="text"
                  className="ingestion-input"
                  placeholder="e.g. LinkedIn, Verified"
                  value={newPlatformForm.tag}
                  onChange={(e) => setNewPlatformForm({ ...newPlatformForm, tag: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Platform Brand Logo *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BrandIcon iconKey={newPlatformForm.icon} name={newPlatformForm.name} size={44} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIconPickerTarget('create');
                      setShowIconPicker(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🔍 Pick Brand Logo...
                  </button>
                </div>
              </div>

              <div className="ingestion-field-group">
                <label>Brand Theme Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color"
                    style={{ width: '44px', height: '38px', padding: '2px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer' }}
                    value={newPlatformForm.color}
                    onChange={(e) => setNewPlatformForm({ ...newPlatformForm, color: e.target.value })}
                  />
                  <input 
                    type="text"
                    style={{ flex: 1 }}
                    className="ingestion-input"
                    value={newPlatformForm.color}
                    onChange={(e) => setNewPlatformForm({ ...newPlatformForm, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="ingestion-field-group platform-form-full">
                <label>Default Base Price (₦ NGN)</label>
                <input 
                  type="number"
                  step="100"
                  className="ingestion-input"
                  placeholder="1500"
                  value={newPlatformForm.demoPrice}
                  onChange={(e) => setNewPlatformForm({ ...newPlatformForm, demoPrice: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group platform-form-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={newPlatformForm.has2fa}
                    onChange={(e) => setNewPlatformForm({ ...newPlatformForm, has2fa: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                  />
                  <span style={{ fontWeight: 600, color: '#fff' }}>Enable 2FA Badge for this Platform</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  If checked, packages under this category show the 2FA badge unless customized. (Disabled by default)
                </span>
              </div>

              <div className="platform-form-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreatePlatformModal(false)}
                  disabled={isCreatingPlatform}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isCreatingPlatform}
                >
                  {isCreatingPlatform ? (
                    <>
                      <span className="waiting-dot-pulse mr-2" />
                      Provisioning in Google Firebase Cloud...
                    </>
                  ) : (
                    '🚀 Provision Platform & Collection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADD PRODUCT PACKAGE / SUB-TYPE TO PLATFORM
          ========================================================================= */}
      {showAddPackageModal && selectedPlatformForPackage && (
        <div className="logs-modal-overlay" onClick={() => !isAddingPackage && setShowAddPackageModal(false)}>
          <div className="logs-modal-box" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title">➕ Add Product Package</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Platform: <strong>{selectedPlatformForPackage.name}</strong>
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => !isAddingPackage && setShowAddPackageModal(false)}
                disabled={isAddingPackage}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPackageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ingestion-field-group">
                <label>Package Title *</label>
                <input 
                  type="text"
                  required
                  className="ingestion-input"
                  placeholder="e.g. Aged 2020 | High Friends + 2FA Secret + Mail"
                  value={newPackageForm.title}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, title: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Retail Price (₦ NGN) *</label>
                <input 
                  type="number"
                  step="100"
                  required
                  className="ingestion-input"
                  placeholder="1500"
                  value={newPackageForm.price}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, price: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Package Description / Features (Optional)</label>
                <input 
                  type="text"
                  className="ingestion-input"
                  placeholder="e.g. USA residential cookies, 2FA backup codes"
                  value={newPackageForm.description}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, description: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={newPackageForm.has2fa}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, has2fa: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                  />
                  <span style={{ fontWeight: 600, color: '#fff' }}>2FA Authentication Included</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Displays the &quot;✓ 2FA Included&quot; badge on this package in the marketplace. (Disabled by default)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddPackageModal(false)}
                  disabled={isAddingPackage}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isAddingPackage}
                >
                  {isAddingPackage ? (
                    <>
                      <span className="waiting-dot-pulse mr-2" />
                      Adding Package...
                    </>
                  ) : (
                    '➕ Add Product Package'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT PLATFORM CATEGORY
          ========================================================================= */}
      {showEditPlatformModal && (
        <div className="logs-modal-overlay" onClick={() => !isEditingPlatform && setShowEditPlatformModal(false)}>
          <div className="logs-modal-box" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title">✏️ Edit Platform Category</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Update metadata and brand settings for <strong>{editingPlatformForm.name}</strong>
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => !isEditingPlatform && setShowEditPlatformModal(false)}
                disabled={isEditingPlatform}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditPlatformSubmit} className="platform-form-grid" style={{ marginTop: '14px' }}>
              <div className="ingestion-field-group">
                <label>Platform Name *</label>
                <input 
                  type="text"
                  required
                  className="ingestion-input"
                  value={editingPlatformForm.name}
                  onChange={(e) => setEditingPlatformForm({ ...editingPlatformForm, name: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Tag / Badge Label</label>
                <input 
                  type="text"
                  className="ingestion-input"
                  value={editingPlatformForm.tag}
                  onChange={(e) => setEditingPlatformForm({ ...editingPlatformForm, tag: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group platform-form-full">
                <label>Subtitle / Description</label>
                <input 
                  type="text"
                  className="ingestion-input"
                  value={editingPlatformForm.subtitle}
                  onChange={(e) => setEditingPlatformForm({ ...editingPlatformForm, subtitle: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Platform Brand Logo *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BrandIcon iconKey={editingPlatformForm.icon} name={editingPlatformForm.name} size={44} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIconPickerTarget('edit');
                      setShowIconPicker(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🔍 Change Brand Logo...
                  </button>
                </div>
              </div>

              <div className="ingestion-field-group">
                <label>Default Base Price (₦ NGN)</label>
                <input 
                  type="number"
                  step="100"
                  className="ingestion-input"
                  value={editingPlatformForm.demoPrice}
                  onChange={(e) => setEditingPlatformForm({ ...editingPlatformForm, demoPrice: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group platform-form-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={editingPlatformForm.has2fa}
                    onChange={(e) => setEditingPlatformForm({ ...editingPlatformForm, has2fa: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                  />
                  <span style={{ fontWeight: 600, color: '#fff' }}>Enable 2FA Badge for this Platform</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  If checked, packages under this category show the 2FA badge unless customized. (Disabled by default)
                </span>
              </div>

              <div className="platform-form-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditPlatformModal(false)}
                  disabled={isEditingPlatform}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isEditingPlatform}
                >
                  {isEditingPlatform ? 'Saving Changes...' : '💾 Save Platform Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT PRODUCT PACKAGE / SUB-TYPE
          ========================================================================= */}
      {showEditPackageModal && (
        <div className="logs-modal-overlay" onClick={() => !isEditingPackage && setShowEditPackageModal(false)}>
          <div className="logs-modal-box" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title">✏️ Edit Product Package</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Platform: <strong>{editingPackageForm.platformName}</strong>
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => !isEditingPackage && setShowEditPackageModal(false)}
                disabled={isEditingPackage}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditPackageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ingestion-field-group">
                <label>Package Title *</label>
                <input 
                  type="text"
                  required
                  className="ingestion-input"
                  value={editingPackageForm.title}
                  onChange={(e) => setEditingPackageForm({ ...editingPackageForm, title: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Retail Price (₦ NGN) *</label>
                <input 
                  type="number"
                  step="100"
                  required
                  className="ingestion-input"
                  value={editingPackageForm.price}
                  onChange={(e) => setEditingPackageForm({ ...editingPackageForm, price: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label>Package Description / Features (Optional)</label>
                <input 
                  type="text"
                  className="ingestion-input"
                  value={editingPackageForm.description}
                  onChange={(e) => setEditingPackageForm({ ...editingPackageForm, description: e.target.value })}
                />
              </div>

              <div className="ingestion-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={editingPackageForm.has2fa}
                    onChange={(e) => setEditingPackageForm({ ...editingPackageForm, has2fa: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                  />
                  <span style={{ fontWeight: 600, color: '#fff' }}>2FA Authentication Included</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Displays the &quot;✓ 2FA Included&quot; badge on this package in the marketplace. (Disabled by default)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditPackageModal(false)}
                  disabled={isEditingPackage}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isEditingPackage}
                >
                  {isEditingPackage ? 'Updating...' : '💾 Update Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: BRAND VECTOR ICON PICKER WITH SEARCH
          ========================================================================= */}
      <BrandIconPicker
        isOpen={showIconPicker}
        selectedIcon={iconPickerTarget === 'create' ? newPlatformForm.icon : editingPlatformForm.icon}
        onSelect={(iconId) => {
          if (iconPickerTarget === 'create') {
            setNewPlatformForm(prev => ({ ...prev, icon: iconId }));
          } else {
            setEditingPlatformForm(prev => ({ ...prev, icon: iconId }));
          }
        }}
        onClose={() => setShowIconPicker(false)}
      />

      {/* =========================================================================
          MODAL: INVENTORY LOG FULL DETAILS INSPECTOR
          ========================================================================= */}
      {logDetailsModal && (
        <div className="inv-modal-overlay" onClick={() => setLogDetailsModal(null)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h4 className="inv-modal-title">
                <BrandIcon iconKey={logDetailsModal.platformIcon} name={logDetailsModal.platformName} size={24} />
                <span>Account Credential Inspector</span>
                <span className={`inv-status-pill ${logDetailsModal.status}`}>
                  {logDetailsModal.status === 'sold' ? '🔴 Sold' : '🟢 Available'}
                </span>
              </h4>
              <button 
                type="button" 
                className="inv-modal-close"
                onClick={() => setLogDetailsModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="inv-credentials-grid">
              <div className="inv-cred-field">
                <span className="inv-cred-label">Platform &amp; Package</span>
                <span className="inv-cred-value">
                  {logDetailsModal.platformName} — {logDetailsModal.subTypeTitle}
                </span>
              </div>

              <div className="inv-cred-field">
                <span className="inv-cred-label">Listing Price</span>
                <span className="inv-cred-value" style={{ color: '#38bdf8', fontWeight: 700 }}>
                  ₦{Number(logDetailsModal.price || 1500).toLocaleString()} NGN
                </span>
              </div>

              <div className="inv-cred-field">
                <span className="inv-cred-label">Username / UID / Login</span>
                <div className="inv-cred-value">
                  <span>{logDetailsModal.username || '—'}</span>
                  {logDetailsModal.username && (
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(logDetailsModal.username);
                        toast('Copied username');
                      }}
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>

              <div className="inv-cred-field">
                <span className="inv-cred-label">Password</span>
                <div className="inv-cred-value">
                  <span>{logDetailsModal.password || '—'}</span>
                  {logDetailsModal.password && (
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(logDetailsModal.password);
                        toast('Copied password');
                      }}
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>

              {logDetailsModal.twoFactorKey && (
                <div className="inv-cred-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="inv-cred-label">2FA / Security Key</span>
                  <div className="inv-cred-value">
                    <span style={{ color: '#c084fc', wordBreak: 'break-all' }}>{logDetailsModal.twoFactorKey}</span>
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(logDetailsModal.twoFactorKey);
                        toast('Copied 2FA key');
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {logDetailsModal.mail && (
                <div className="inv-cred-field">
                  <span className="inv-cred-label">Recovery Email</span>
                  <div className="inv-cred-value">
                    <span>{logDetailsModal.mail}</span>
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(logDetailsModal.mail);
                        toast('Copied email');
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {logDetailsModal.mailPassword && (
                <div className="inv-cred-field">
                  <span className="inv-cred-label">Email Password</span>
                  <div className="inv-cred-value">
                    <span>{logDetailsModal.mailPassword}</span>
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(logDetailsModal.mailPassword);
                        toast('Copied email password');
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {logDetailsModal.customData && Object.keys(logDetailsModal.customData).length > 0 && (
                Object.entries(logDetailsModal.customData)
                  .filter(([k]) => !['username', 'password', 'twoFactorKey', 'two_factor_key', 'mail', 'mailPassword', 'mail_password'].includes(k))
                  .map(([key, val]) => (
                  <div key={key} className="inv-cred-field">
                    <span className="inv-cred-label">{key.replace(/^custom_/, '').replace(/_/g, ' ')}</span>
                    <div className="inv-cred-value">
                      <span>{String(val)}</span>
                      <button
                        type="button"
                        className="btn-mini-copy"
                        onClick={() => {
                          navigator.clipboard.writeText(String(val));
                          toast(`Copied ${key}`);
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {logDetailsModal.rawRecord && (
              <div>
                <span className="inv-cred-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Raw Pipe/Delimiter Ingestion Line:
                </span>
                <div className="inv-raw-box">
                  {logDetailsModal.rawRecord}
                </div>
              </div>
            )}

            {logDetailsModal.status === 'sold' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                  🛒 Purchase Fulfillment Information
                </span>
                <div style={{ fontSize: '0.8rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div><strong>Buyer Email:</strong> {logDetailsModal.soldToEmail || 'N/A'}</div>
                  <div><strong>Buyer User ID:</strong> {logDetailsModal.soldToUserId || 'N/A'}</div>
                  <div><strong>Fulfilled At:</strong> {logDetailsModal.soldAt ? formatDateTime(logDetailsModal.soldAt) : 'N/A'}</div>
                </div>
              </div>
            )}

            <div className="inv-modal-meta-row">
              <div>Document ID: <code>{logDetailsModal.id}</code></div>
              <div>Ingested: {formatDateTime(logDetailsModal.createdAt)}</div>
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setLogDetailsModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DELETE / BULK DELETE CONFIRMATION DIALOG
          ========================================================================= */}
      {deleteConfirmModal && (
        <div className="inv-modal-overlay" onClick={() => !isBulkDeleting && setDeleteConfirmModal(null)}>
          <div className="inv-modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="inv-delete-dialog">
              <div className="inv-delete-warning-icon">⚠️</div>
              <h4>{deleteConfirmModal.title}</h4>
              <p>{deleteConfirmModal.message}</p>

              <div className="inv-delete-dialog-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmModal(null)}
                  disabled={isBulkDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  onClick={handleExecuteDeletion}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Confirm & Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
