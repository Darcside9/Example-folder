// ==========================================================================
// CHRIS SHOPPER — ADMIN MASTER CONTROL PANEL
// Features: Zero-Trust Account Logs Ingestion Zone, Live Delimiter Tokenizer,
// Interactive Verification Grid, Batch Sync to Appwrite Cloud, & Real-Time Pricing
// ==========================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetAllUsers, adminUpdateUserBalance } from '../lib/dashboardService';
import { adminBulkImportLogs } from '../lib/appwriteDispenser';
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

const SAMPLE_LOG_LINE = '61590748374787 | dv4WaXTqmkR3 | OQVZ ZBN2 SEHY TINT SWPA RL66 SZZK 4RWU | BrandeeOats60@outlook.com | qvli4Ham3';

export default function AdminDashboard({ onShowToast }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('importer'); // 'importer' | 'platforms' | 'delimiters' | 'pricing' | 'users' | 'orders'
  
  // Data States
  const [users, setUsers] = useState([]);
  const [pricingProducts, setPricingProducts] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProductPrice, setNewProductPrice] = useState('');

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
    demoPrice: '1500'
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
    demoPrice: '1500'
  });

  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [selectedPlatformForPackage, setSelectedPlatformForPackage] = useState(null);
  const [newPackageForm, setNewPackageForm] = useState({
    title: '',
    price: '1500',
    description: ''
  });

  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackageForm, setEditingPackageForm] = useState({
    platformId: '',
    platformName: '',
    packageId: '',
    title: '',
    price: '1500',
    description: ''
  });

  // -------------------------------------------------------------------------
  // INGESTION ZONE STATES
  // -------------------------------------------------------------------------
  const [targetPlatform, setTargetPlatform] = useState('facebook');
  const [selectedSubTypeId, setSelectedSubTypeId] = useState('fb-type-1');
  const [customSubTypeTitle, setCustomSubTypeTitle] = useState('');
  const [logPrice, setLogPrice] = useState('1500');
  const [rawLogsInput, setRawLogsInput] = useState('');
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

  // Load platforms catalog from Appwrite Cloud DB
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

  // Load registered users and live Appwrite pricing
  useEffect(() => {
    async function loadData() {
      try {
        const [usrData, priceData] = await Promise.all([
          adminGetAllUsers(),
          fetchLivePricing()
        ]);
        setUsers(usrData || []);
        setPricingProducts(priceData || []);
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    }
    loadData();

    // Subscribe to live pricing updates
    const unsubscribe = subscribeToPricingUpdates((updatedList) => {
      setPricingProducts(updatedList);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const toast = (msg) => {
    if (onShowToast) onShowToast(msg);
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
  // BATCH SYNC TO APPWRITE CLOUD
  // -------------------------------------------------------------------------
  const handleSyncToAppwrite = async () => {
    const validRecords = parsedRows.filter(r => r.isValid);
    if (validRecords.length === 0) {
      toast('No valid records to upload. Please parse and fix any errors.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: validRecords.length, percentage: 0, successCount: 0, failedCount: 0 });

    try {
      // Find package title
      let subTypeTitle = '';
      if (selectedSubTypeId === 'custom') {
        subTypeTitle = customSubTypeTitle || `${activePlatformConfig.name} Custom Package`;
      } else {
        const found = (activePlatformConfig.items || []).find(i => i.id === selectedSubTypeId);
        subTypeTitle = found ? found.title : activePlatformConfig.name;
      }

      const formattedRecords = validRecords.map(r => ({
        username: r.username,
        password: r.password,
        twoFactorKey: r.twoFactorKey,
        mail: r.mail,
        mailPassword: r.mailPassword,
        subTypeId: selectedSubTypeId,
        subTypeTitle: subTypeTitle,
        price: Number(logPrice || 1.50)
      }));

      const res = await adminBulkImportLogs({
        platformId: targetPlatform,
        subTypeId: selectedSubTypeId,
        subTypeTitle,
        price: Number(logPrice || 1.50),
        records: formattedRecords,
        onProgress: (prog) => {
          setSyncProgress(prog);
        }
      });

      setSyncResult(res);
      toast(`🎉 Successfully uploaded ${res.successCount} account logs to Appwrite ${activePlatformConfig.name}!`);

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
      demoPrice: '1500'
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
        packages: [] // Platform starts clean with 0 packages until explicitly added
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
      demoPrice: String(platform.demoPrice || 1500)
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
        demoPrice: Number(editingPlatformForm.demoPrice || 1500)
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
      description: ''
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
        description: newPackageForm.description.trim()
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
      description: pkg.description || ''
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
        description: editingPackageForm.description.trim()
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
          <div className="dash-avatar-circle admin-avatar">👑</div>
          <div>
            <div className="dash-title-row">
              <h2>Admin Master Control Panel</h2>
              <span className="admin-badge-pill">Appwrite Cloud Zero-Trust</span>
            </div>
            <p className="dash-email-sub">Appwrite Cloud Database Management &amp; Account Logs Dispenser Controller</p>
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
          <span className="dash-metric-label">Appwrite Cloud DB</span>
          <span className="dash-metric-val text-cyan">Connected ⚡</span>
          <span className="dash-metric-sub">Project: darc (TablesDB)</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Serverless Dispenser</span>
          <span className="dash-metric-val text-green">Online 🛡️</span>
          <span className="dash-metric-sub">Zero-Trust Password Masking</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Managed Platforms</span>
          <span className="dash-metric-val text-cyan">{platforms.length || 5} Platforms</span>
          <span className="dash-metric-sub">Auto-Provisioned Collections</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Registered Users</span>
          <span className="dash-metric-val text-green">{users.length}</span>
          <span className="dash-metric-sub">User Balance Profiles</span>
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
          className={`dash-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          ⚙️ Dynamic Pricing Controller ({pricingProducts.length})
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
                <p>Paste raw clipboard data with pipe-delimited format. System parses, sanitizes, and syncs directly into Appwrite Cloud.</p>
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
                        setTargetPlatform(e.target.value);
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
                  onClick={handleSyncToAppwrite}
                  disabled={isSyncing || validRowCount === 0}
                  style={{ minWidth: '220px' }}
                >
                  {isSyncing ? '⏳ Syncing to Appwrite...' : `🚀 Sync ${validRowCount} Accounts to Appwrite Cloud`}
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
                    🎉 Batch Sync Complete: {syncResult.successCount} accounts stored in Appwrite Cloud!
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
          TAB 2: DYNAMIC CATEGORIES & PLATFORMS (APPWRITE CLOUD DB)
          ========================================================================= */}
      {activeTab === 'platforms' && (
        <div className="dashboard-tab-content">
          <div className="platforms-tab-container">
            <div className="platforms-tab-header">
              <div>
                <h3>🗂️ Platform Categories &amp; Product Types</h3>
                <p>
                  Manage live platforms in Appwrite Cloud DB. Create new platforms with auto-provisioned collections and add account packages instantly.
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
                <span className="waiting-dot-pulse mr-2" /> Loading platform catalog from Appwrite Cloud...
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
                    {isSavingSchema ? '⏳ Saving to Appwrite Cloud...' : `💾 Save Delimiter Format for ${activeDelimiterPlatform?.name}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DYNAMIC SERVICES & PRICING CONTROLLER (APPWRITE CLOUD)
          ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="dashboard-tab-content">
          <div className="dash-table-card" style={{ marginBottom: '24px' }}>
            <div className="dash-table-header">
              <h3>📱 Physical SIM Carrier Rates (SMS Verification)</h3>
              <p>Adjust live wholesale rates and availability for SMS carrier verification lines. Synchronized with Appwrite in real-time.</p>
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
                    <td className="font-mono">ord_appwrite_1</td>
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
                  Provisions a new private Appwrite collection, standard schema, and registers it in the live catalog.
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
                      Provisioning in Appwrite Cloud...
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
    </div>
  );
}
