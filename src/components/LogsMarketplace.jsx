// ==========================================================================
// CHRIS SHOPPER — LOGS MARKETPLACE COMPONENT (ACCSZONE 2-TIER MODEL + BTS MODAL)
// Live stock count aggregation, multi-select username picker, shopping cart,
// bulk dispensing with directive modal, and 30-day credential retention.
// ==========================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchAvailableAccountLogs, 
  dispenseSpecificAccountLog,
  bulkDispenseAccountLogs,
  downloadCredentialsFile,
  downloadBulkCredentialsFile
} from '../lib/logsService';
import { useAuth } from '../lib/AuthContext';
import { siteConfig } from '../data/siteConfig';
import BrandIcon from './BrandIcon';
import LogsCartDrawer from './LogsCartDrawer';
import '../styles/components/logs-cart.css';

// Helper for rendering authentic brand vector logo on sleek black badge
function PlatformBrandIcon({ platformId, icon, size = 24, className = '' }) {
  return <BrandIcon iconKey={icon || platformId} name={platformId} size={size} className={className} />;
}

export default function LogsMarketplace({ 
  onRequireAuth, 
  onShowToast, 
  isDashboard = false,
  onPurchaseComplete,
  onNavigateTab
}) {
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion state: collapsed by default
  const [expandedCategories, setExpandedCategories] = useState({});

  // Shopping Cart State (persisted in localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cs_logs_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Account Log Selection Modal (Step 1: Choose Usernames with Multi-Select)
  const [accountSelectModal, setAccountSelectModal] = useState({
    isOpen: false,
    category: null,
    subType: null,
    selectedUsernames: [],
    searchFilter: '',
    loading: false,
    error: null,
  });

  // Single Credentials Delivery Modal (Step 2 for single item buy)
  const [deliveryModal, setDeliveryModal] = useState({
    isOpen: false,
    credential: null,
    showPassword: false,
    showMailPassword: false,
    copiedField: null,
  });

  // Bulk Purchase Directive Modal (Step 2 for bulk orders)
  const [bulkDirectiveModal, setBulkDirectiveModal] = useState({
    isOpen: false,
    credentials: [],
    totalCost: 0,
  });

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem('cs_logs_cart', JSON.stringify(newCart));
    } catch {}
  };

  const handleAddToCart = (itemsToAdd) => {
    const existingIds = new Set(cart.map(i => `${i.platformId}_${i.username}`));
    const freshItems = itemsToAdd.filter(i => !existingIds.has(`${i.platformId}_${i.username}`));

    if (freshItems.length === 0) {
      toast('Selected account(s) are already in your cart.');
      return;
    }

    const updated = [...cart, ...freshItems];
    saveCart(updated);
    toast(`🛒 Added ${freshItems.length} account${freshItems.length > 1 ? 's' : ''} to cart!`);
  };

  const handleRemoveFromCart = (itemIdOrUsername) => {
    const updated = cart.filter(i => i.id !== itemIdOrUsername && i.username !== itemIdOrUsername);
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  // Fetch sanitized inventory catalog from Appwrite Cloud & Dispenser
  const loadInventory = async () => {
    setLoading(true);
    try {
      const catalog = await fetchAvailableAccountLogs();
      setCategories(catalog);
    } catch (err) {
      console.error('Error loading logs catalog:', err);
      if (onShowToast) onShowToast('Failed to sync live Appwrite inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();

    const handlePlatformsUpdated = () => {
      loadInventory();
    };

    window.addEventListener('platforms-updated', handlePlatformsUpdated);
    return () => window.removeEventListener('platforms-updated', handlePlatformsUpdated);
  }, []);

  const toast = (msg) => {
    if (onShowToast) onShowToast(msg);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setDeliveryModal(prev => ({ ...prev, copiedField: fieldName }));
    toast(`Copied ${fieldName}!`);
    setTimeout(() => {
      setDeliveryModal(prev => ({ ...prev, copiedField: null }));
    }, 2000);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Open the Account Log Selection Modal for a specific sub-type
  const handleOpenAccountSelect = (category, subType) => {
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        toast('Please sign in or create an account to browse and buy account logs.');
      }
      return;
    }

    const availableAccounts = (subType.accounts || []).filter(a => a.isAvailable !== false);
    const initialSelection = availableAccounts.length > 0 ? [availableAccounts[0].username] : [];

    setAccountSelectModal({
      isOpen: true,
      category,
      subType,
      selectedUsernames: initialSelection,
      searchFilter: '',
      loading: false,
      error: null,
    });
  };

  const toggleSelectUsername = (username) => {
    setAccountSelectModal(prev => {
      const exists = prev.selectedUsernames.includes(username);
      const updated = exists 
        ? prev.selectedUsernames.filter(u => u !== username)
        : [...prev.selectedUsernames, username];
      return { ...prev, selectedUsernames: updated };
    });
  };

  const toggleSelectAll = (availableUsernames) => {
    setAccountSelectModal(prev => {
      const isAllSelected = availableUsernames.length > 0 && availableUsernames.every(u => prev.selectedUsernames.includes(u));
      return {
        ...prev,
        selectedUsernames: isAllSelected ? [] : [...availableUsernames]
      };
    });
  };

  // Confirm Purchase of the Selected Username(s) directly
  const handleConfirmAccountPurchase = async () => {
    const selectedCount = accountSelectModal.selectedUsernames.length;
    if (selectedCount === 0 || !currentUser) return;

    setAccountSelectModal(prev => ({ ...prev, loading: true, error: null }));

    try {
      const balance = Number(currentUser.balance || 0);
      const targetCategory = accountSelectModal.category;
      const targetSubType = accountSelectModal.subType;

      if (selectedCount === 1) {
        // Single Account Purchase Flow
        const targetUsername = accountSelectModal.selectedUsernames[0];
        const targetAccount = (targetSubType.accounts || []).find(a => a.username === targetUsername);
        const dynamicPrice = Number(
          targetAccount?.price !== undefined 
            ? targetAccount.price 
            : (targetSubType?.price !== undefined ? targetSubType.price : (targetCategory?.demoPrice || 1500))
        );

        const result = await dispenseSpecificAccountLog({
          username: targetUsername,
          platformId: targetCategory.id,
          subTypeId: targetSubType.id,
          userId: currentUser.id,
          userEmail: currentUser.email,
          currentBalance: balance,
          price: dynamicPrice,
        });

        if (refreshUser) await refreshUser();

        setAccountSelectModal(prev => ({ ...prev, isOpen: false, loading: false }));

        setDeliveryModal({
          isOpen: true,
          credential: result.credential,
          showPassword: false,
          showMailPassword: false,
          copiedField: null,
        });

        toast(`🎉 Successfully purchased ${result.credential.platform} Account (@${result.credential.username})!`);

        if (onPurchaseComplete) {
          onPurchaseComplete(result.credential);
        }

        await loadInventory();
      } else {
        // Multi-Account Bulk Purchase Flow
        const itemsToBuy = accountSelectModal.selectedUsernames.map(username => {
          const acc = (targetSubType.accounts || []).find(a => a.username === username);
          return {
            username,
            platformId: targetCategory.id,
            platform: targetCategory.name,
            subTypeId: targetSubType.id,
            title: targetSubType.title,
            price: acc?.price !== undefined ? acc.price : (targetSubType?.price || targetCategory?.demoPrice || 1500),
            icon: targetCategory.icon || targetCategory.id
          };
        });

        const result = await bulkDispenseAccountLogs({
          items: itemsToBuy,
          userId: currentUser.id,
          userEmail: currentUser.email,
          currentBalance: balance
        });

        if (refreshUser) await refreshUser();

        setAccountSelectModal(prev => ({ ...prev, isOpen: false, loading: false }));

        setBulkDirectiveModal({
          isOpen: true,
          credentials: result.credentials,
          totalCost: result.totalCost
        });

        toast(`🎉 Bulk purchase successful! ${result.credentials.length} accounts dispensed.`);

        if (onPurchaseComplete) {
          onPurchaseComplete(result.credentials);
        }

        await loadInventory();
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setAccountSelectModal(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Purchase failed.'
      }));
    }
  };

  // Add all selected usernames to cart
  const handleAddSelectedToCart = () => {
    const selectedCount = accountSelectModal.selectedUsernames.length;
    if (selectedCount === 0) return;

    const targetCategory = accountSelectModal.category;
    const targetSubType = accountSelectModal.subType;

    const items = accountSelectModal.selectedUsernames.map(username => {
      const acc = (targetSubType.accounts || []).find(a => a.username === username);
      return {
        id: `${targetCategory.id}_${username}`,
        username,
        platformId: targetCategory.id,
        platform: targetCategory.name,
        subTypeId: targetSubType.id,
        title: targetSubType.title,
        price: acc?.price !== undefined ? acc.price : (targetSubType?.price || targetCategory?.demoPrice || 1500),
        icon: targetCategory.icon || targetCategory.id
      };
    });

    handleAddToCart(items);
    setAccountSelectModal(prev => ({ ...prev, isOpen: false }));
  };

  // Filtered categories
  const filteredCatalog = useMemo(() => {
    return categories
      .filter(cat => cat.id !== 'all')
      .filter(cat => {
        if (selectedPlatform !== 'all' && cat.id !== selectedPlatform) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (cat.name || '').toLowerCase().includes(q);
          const matchSubtitle = (cat.subtitle || '').toLowerCase().includes(q);
          const matchItems = (cat.items || []).some(item => 
            (item.title || '').toLowerCase().includes(q)
          );
          return matchName || matchSubtitle || matchItems;
        }
        return true;
      });
  }, [categories, selectedPlatform, searchQuery]);

  // Auto-expand category if a search matches
  useEffect(() => {
    if (searchQuery.trim()) {
      const openMap = {};
      categories.forEach(cat => {
        openMap[cat.id] = true;
      });
      setExpandedCategories(openMap);
    }
  }, [searchQuery, categories]);

  // Compute available accounts for the active selection modal
  const modalAvailableAccounts = useMemo(() => {
    if (!accountSelectModal.subType) return [];
    const accounts = accountSelectModal.subType.accounts || [];
    if (!accountSelectModal.searchFilter.trim()) return accounts;
    const filter = accountSelectModal.searchFilter.toLowerCase();
    return accounts.filter(acc => acc.username.toLowerCase().includes(filter));
  }, [accountSelectModal.subType, accountSelectModal.searchFilter]);

  const modalAvailableUsernames = useMemo(() => {
    return modalAvailableAccounts.filter(a => a.isAvailable !== false).map(a => a.username);
  }, [modalAvailableAccounts]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [cart]);

  return (
    <section className={`logs-marketplace-section ${isDashboard ? 'in-dashboard' : 'reveal-on-scroll'}`} id="logs-marketplace">
      {/* Header Area */}
      {!isDashboard && (
        <div className="logs-header-area">
          <div className="logs-badge-pill">
            <span className="logs-live-dot" />
            <span>Verified Aged Accounts • 2FA &amp; Mail Access</span>
          </div>
          <h2 className="logs-header-title">
            Social &amp; Platform <span className="text-gradient">Account Logs</span>
          </h2>
          <p className="logs-header-desc">
            Aged profiles with 2FA authenticator secrets and full email access. Select an account category to choose your preferred username prior to checkout, or purchase in bulk via our shopping cart.
          </p>
        </div>
      )}

      {/* =========================================================================
          AUTH GUARD FOR STRAY VISITORS (MEMBERS-ONLY ACCESS)
          ========================================================================= */}
      {!currentUser && !isDashboard ? (
        <div className="members-only-gate">
          <div className="gate-glow-halo" />
          <div className="gate-card-box">
            <div className="gate-icon-badge">
              <span className="gate-lock-icon">🔒</span>
            </div>
            <h3 className="gate-title">Members-Only Account Logs Access</h3>
            <p className="gate-desc">
              Browsing live account inventory, previewing available usernames, and purchasing 2FA-secured profiles is exclusively available to registered Chris Shopper members.
            </p>
            <div className="gate-perks-list">
              <div className="gate-perk-item">
                <span className="gate-check">✓</span>
                <span>Aged &amp; Verified Facebook, TikTok, Instagram, Twitter &amp; Textplus accounts</span>
              </div>
              <div className="gate-perk-item">
                <span className="gate-check">✓</span>
                <span>Preview and choose your preferred username prior to checkout</span>
              </div>
              <div className="gate-perk-item">
                <span className="gate-check">✓</span>
                <span>Instant automated FIFO delivery with 2FA secret keys &amp; full email access</span>
              </div>
            </div>
            <div className="gate-actions-row">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => {
                  if (onRequireAuth) onRequireAuth();
                }}
              >
                <span>Create Free Account</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  if (onRequireAuth) onRequireAuth();
                }}
              >
                Sign In to Existing Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           AUTHENTICATED MEMBERS CATALOG VIEW
           ========================================================================= */
        <>
          {/* Filter and Search Controls Bar */}
          <div className="logs-controls-bar">
            <div className="logs-platform-pills">
              <button
                type="button"
                className={`logs-platform-pill ${selectedPlatform === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('all')}
              >
                <span>🌐</span>
                <span>All Platforms</span>
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`logs-platform-pill ${selectedPlatform === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlatform(cat.id)}
                >
                  <PlatformBrandIcon platformId={cat.id} icon={cat.icon} size={16} className="pill-brand-icon" />
                  <span>{cat.name.replace(' Accounts', '')}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <div className="logs-search-wrapper" style={{ flex: '1 1 240px', maxWidth: '380px' }}>
                <svg className="logs-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  className="logs-search-input"
                  placeholder="Search specs, 2FA, country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Shopping Cart Button */}
              <button
                type="button"
                className={`logs-cart-toggle-btn ${cart.length > 0 ? 'has-items' : ''}`}
                onClick={() => setIsCartOpen(true)}
                title="View Bulk Purchase Shopping Cart"
              >
                <span style={{ fontSize: '1.05rem' }}>🛒</span>
                <span>Cart</span>
                {cart.length > 0 && (
                  <>
                    <span className="cart-count-badge">{cart.length}</span>
                    <span className="cart-subtotal-text">
                      {siteConfig.formatNaira(cartTotal)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AccsZone 2-Tier Catalog Container */}
          <div className="accszone-container">
            {loading && categories.length === 0 ? (
              <div className="accszone-loading">
                <span className="waiting-dot-pulse mr-2" /> Syncing live verified inventory...
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="accszone-empty-search">
                No account categories found matching "{searchQuery}".
              </div>
            ) : (
              filteredCatalog.map(cat => {
                const isExpanded = !!expandedCategories[cat.id];
                const hasItems = Array.isArray(cat.items) && cat.items.length > 0;
                const headerTitle = cat.subtitle ? `${cat.name} - ${cat.subtitle}` : cat.name;

                // Total available stock aggregated across all types
                const totalStock = cat.totalStock !== undefined 
                  ? cat.totalStock 
                  : (cat.items || []).reduce((acc, it) => acc + (it.stockCount || (it.accounts || []).filter(a => a.isAvailable !== false).length || 0), 0);

                return (
                  <div key={cat.id} className="accszone-category-block">
                    {/* TIER 1: Main Category Header Banner */}
                    <button
                      type="button"
                      id={`accszone-header-${cat.id}`}
                      aria-controls={`accszone-dropdown-${cat.id}`}
                      className={`accszone-category-header ${isExpanded ? 'is-expanded' : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="accszone-cat-info">
                        <BrandIcon iconKey={cat.icon || cat.id} name={cat.name} size={36} />
                        <div className="accszone-cat-titles">
                          <span className="accszone-cat-title">{headerTitle}</span>
                        </div>
                      </div>

                      <div className="accszone-cat-meta">
                        {/* Main Category Stock Badge: e.g. 9 Available · 3 Configs */}
                        <span className={`accszone-cat-badge ${totalStock > 0 ? 'has-stock' : 'no-stock'}`}>
                          {totalStock > 0 
                            ? `${totalStock} Available · ${cat.items?.length || 0} Configurations` 
                            : (hasItems ? `0 Available · ${cat.items?.length || 0} Configurations` : 'Catalog Synced')
                          }
                        </span>
                        <span className={`accszone-chevron ${isExpanded ? 'open' : ''}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </span>
                      </div>
                    </button>

                    {/* TIER 2: List of Account Types Directly Underneath (Fluid Grid Accordion) */}
                    <div 
                      className={`accszone-items-collapse ${isExpanded ? 'is-open' : ''}`}
                      id={`accszone-dropdown-${cat.id}`}
                      role="region"
                      aria-labelledby={`accszone-header-${cat.id}`}
                      aria-hidden={!isExpanded}
                    >
                      <div className="accszone-items-inner">
                        <div className="accszone-items-list">
                          {hasItems ? (
                            (() => {
                              const q = searchQuery.trim().toLowerCase();
                              const matchCat = (cat.name || '').toLowerCase().includes(q) || (cat.subtitle || '').toLowerCase().includes(q);
                              const displayItems = q && !matchCat 
                                ? cat.items.filter(item => (item.title || '').toLowerCase().includes(q))
                                : cat.items;

                              if (displayItems.length === 0) {
                                return (
                                  <div className="accszone-empty-items">
                                    <span className="accszone-empty-dot" />
                                    <span>No configurations in {cat.name} match "{searchQuery}".</span>
                                  </div>
                                );
                              }

                              return displayItems.map((item, idx) => {
                                const itemStock = item.stockCount !== undefined 
                                  ? item.stockCount 
                                  : (item.accounts || []).filter(a => a.isAvailable !== false).length;
                                const isSoldOut = itemStock === 0;

                                return (
                                  <div 
                                    key={item.id || idx} 
                                    className={`accszone-item-row is-clickable ${isSoldOut ? 'is-sold-out' : ''}`}
                                    onClick={() => handleOpenAccountSelect(cat, item)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenAccountSelect(cat, item);
                                      }
                                    }}
                                    title={isSoldOut ? `${cat.name} configuration is currently sold out` : `Click to view and select available ${cat.name} usernames`}
                                  >
                                    {/* Top / Left Section: Icon & Full Description */}
                                    <div className="accszone-item-main">
                                      <BrandIcon iconKey={cat.icon || cat.id} name={cat.name} size={28} />

                                      <div className="accszone-item-content">
                                        <span className="accszone-item-title">
                                          {item.title}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Bottom / Right Section: Stock Box, Price Tag & CTA Button */}
                                    <div className="accszone-item-status-col">
                                      {/* Small UI stock box per type (e.g. 2 in stock / Sold Out) */}
                                      <span className={`accszone-stock-box ${isSoldOut ? 'sold-out' : 'in-stock'}`}>
                                        <span className="stock-dot" />
                                        {isSoldOut ? 'Sold Out' : `${itemStock} in stock`}
                                      </span>

                                      <span className="accszone-price-tag font-mono">
                                        {siteConfig.formatNaira(item.price !== undefined ? item.price : (cat.demoPrice || 1500))}
                                      </span>
                                      <span className="accszone-item-tag">
                                        ✓ 2FA + Mail Access
                                      </span>
                                      <span className={`accszone-choose-btn ${isSoldOut ? 'disabled' : ''}`}>
                                        {isSoldOut ? 'Sold Out' : 'Choose Username →'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()
                          ) : (
                            <div className="accszone-empty-items">
                              <span className="accszone-empty-dot" />
                              <span>Specific account configurations for {cat.name} are currently being finalized with verified client inventory.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          STEP 1: ACCOUNT LOG SELECTION MODAL (MULTI-SELECT USERNAME PREVIEW & BULK CART)
          ========================================================================= */}
      {accountSelectModal.isOpen && accountSelectModal.subType && (
        <div 
          className="logs-modal-overlay" 
          onClick={() => !accountSelectModal.loading && setAccountSelectModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div className="account-select-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="account-select-header">
              <div className="account-select-header-info">
                <BrandIcon 
                  iconKey={accountSelectModal.category?.icon || accountSelectModal.category?.id} 
                  name={accountSelectModal.category?.name || accountSelectModal.category?.id} 
                  size={44} 
                />
                <div>
                  <h3 className="account-select-title">Choose Account Usernames</h3>
                  <p className="account-select-subtitle">
                    {accountSelectModal.subType.title}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                className="logs-modal-close-btn"
                disabled={accountSelectModal.loading}
                onClick={() => setAccountSelectModal(prev => ({ ...prev, isOpen: false }))}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Sanitized Security Notice */}
            <div className="account-select-security-notice">
              <span className="security-icon">🔒</span>
              <span>
                <strong>DevTools Protected:</strong> Passwords, 2FA secret keys, and email access credentials are sanitized and packaged behind-the-scenes strictly upon verified purchase.
              </span>
            </div>

            {/* In-Modal Username Filter & Multi-Select Toolbar */}
            <div className="account-select-search-wrap">
              <svg className="logs-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="logs-search-input"
                placeholder="Search usernames in this inventory batch..."
                value={accountSelectModal.searchFilter}
                onChange={(e) => setAccountSelectModal(prev => ({ ...prev, searchFilter: e.target.value }))}
              />
            </div>

            {/* Multi-Select Toolbar */}
            {modalAvailableUsernames.length > 0 && (
              <div className="modal-selection-toolbar">
                <span>
                  {accountSelectModal.selectedUsernames.length} of {modalAvailableUsernames.length} available selected
                </span>
                <button
                  type="button"
                  className="btn-select-all"
                  onClick={() => toggleSelectAll(modalAvailableUsernames)}
                >
                  {modalAvailableUsernames.every(u => accountSelectModal.selectedUsernames.includes(u)) 
                    ? 'Deselect All' 
                    : 'Select All Available'
                  }
                </button>
              </div>
            )}

            {/* Username Selection List */}
            <div className="account-select-list">
              {modalAvailableAccounts.length === 0 ? (
                <div className="account-select-empty">
                  No accounts found matching "{accountSelectModal.searchFilter}".
                </div>
              ) : (
                modalAvailableAccounts.map((acc, aIdx) => {
                  const isSelected = accountSelectModal.selectedUsernames.includes(acc.username);
                  const isAvailable = acc.isAvailable !== false;

                  return (
                    <div
                      key={acc.id || acc.username || aIdx}
                      className={`account-select-item ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      onClick={() => isAvailable && toggleSelectUsername(acc.username)}
                    >
                      <div className="acc-item-left">
                        {/* Multi-select checkbox */}
                        <div className={`acc-checkbox-square ${isSelected ? 'checked' : ''}`}>
                          {isSelected ? '✓' : ''}
                        </div>
                        <div className="acc-avatar-circle">
                          👤
                        </div>
                        <div className="acc-info-col">
                          <span className="acc-username-text">@{acc.username}</span>
                          <span className="acc-platform-sub">{acc.platform || accountSelectModal.category?.name} PVA Account Log</span>
                        </div>
                      </div>

                      <div className="acc-item-right">
                        <span className={`stock-status-tag ${isAvailable ? 'tag-available' : 'tag-sold'}`}>
                          <span className="status-dot" />
                          {isAvailable ? 'In Stock' : 'Sold'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {accountSelectModal.error && (
              <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm mb-4" style={{ margin: '0 20px 10px' }}>
                ⚠️ {accountSelectModal.error}
              </div>
            )}

            {/* Modal Footer / Bulk Actions Bar */}
            {(() => {
              const selectedCount = accountSelectModal.selectedUsernames.length;
              const unitPrice = Number(
                accountSelectModal.subType?.price !== undefined 
                  ? accountSelectModal.subType.price 
                  : (accountSelectModal.category?.demoPrice || 1500)
              );
              const totalSelectedCost = selectedCount * unitPrice;
              const userBalance = Number(currentUser?.balance || 0);
              const remainingBalance = Number((userBalance - totalSelectedCost).toFixed(2));
              const hasSufficientBalance = userBalance >= totalSelectedCost;

              return (
                <div className="account-select-footer">
                  <div className="account-select-footer-meta">
                    <div className="footer-selected-line">
                      <span className="meta-label">Selected:</span>
                      <strong className="text-white">
                        {selectedCount === 0 
                          ? 'None selected' 
                          : `${selectedCount} account${selectedCount > 1 ? 's' : ''}`
                        }
                      </strong>
                    </div>
                    <div className="footer-price-line">
                      <span className="meta-label">Total Cost:</span>
                      <span className="font-mono text-green font-bold">
                        {siteConfig.formatNaira(totalSelectedCost)}
                      </span>
                    </div>
                    <div className="footer-balance-line">
                      <span className="meta-label">Wallet Balance:</span>
                      <span className="font-mono text-cyan">{siteConfig.formatNaira(userBalance)}</span>
                    </div>
                    <div className="footer-remaining-line">
                      <span className="meta-label">Remaining Balance:</span>
                      <span className={`font-mono font-bold ${hasSufficientBalance ? 'text-green' : 'text-danger'}`}>
                        {siteConfig.formatNaira(remainingBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="account-select-footer-actions">
                    {/* Action 1: Add Selected to Cart */}
                    <button
                      type="button"
                      className="btn-action-cart"
                      disabled={accountSelectModal.loading || selectedCount === 0}
                      onClick={handleAddSelectedToCart}
                      title="Add selected accounts to shopping cart"
                    >
                      <span>🛒 Add to Cart ({selectedCount})</span>
                    </button>

                    {/* Action 2: Buy Selected Now */}
                    {!hasSufficientBalance && selectedCount > 0 ? (
                      <a 
                        href={siteConfig.getWhatsAppTopUpUrl(Math.max(2000, Math.ceil(totalSelectedCost - userBalance)), currentUser?.email)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-action-primary"
                      >
                        💬 Top Up ({siteConfig.formatNaira(Math.max(2000, Math.ceil(totalSelectedCost - userBalance)))})
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn-action-primary"
                        disabled={accountSelectModal.loading || selectedCount === 0}
                        onClick={handleConfirmAccountPurchase}
                      >
                        {accountSelectModal.loading ? (
                          <>
                            <span className="waiting-dot-pulse mr-2" />
                            Dispensing...
                          </>
                        ) : (
                          `Buy ${selectedCount > 1 ? `${selectedCount} Now` : 'Now'} (${siteConfig.formatNaira(totalSelectedCost)}) 🔑`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2A: SINGLE CREDENTIALS DELIVERY MODAL (SINGLE ITEM PURCHASE)
          ========================================================================= */}
      {deliveryModal.isOpen && deliveryModal.credential && (
        <div className="logs-modal-overlay">
          <div className="logs-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title text-green">🎉 Credentials Dispensed!</h3>
                <p className="logs-modal-subtitle">
                  {deliveryModal.credential.platform} Account Log • Please save or download your credentials now.
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => setDeliveryModal({ isOpen: false, credential: null, showPassword: false, showMailPassword: false, copiedField: null })}
              >
                ✕
              </button>
            </div>

            {/* 30-Day Expiry Notice */}
            <div className="single-expiry-notice-bar">
              <span>⏰</span>
              <span>
                <strong>30-Day Expiry Notice:</strong> This account log will be automatically purged from your Chris Shopper history after 30 days. Be sure to copy or download your credentials now.
              </span>
            </div>

            <div className="credentials-display-card">
              {/* Username */}
              <div className="credential-field-row">
                <span className="cred-label">Username / UID:</span>
                <div className="cred-val-wrap">
                  <span className="cred-val-mono">{deliveryModal.credential.username}</span>
                  <button 
                    type="button" 
                    className={`btn-mini-copy ${deliveryModal.copiedField === 'Username' ? 'copied' : ''}`}
                    onClick={() => handleCopy(deliveryModal.credential.username, 'Username')}
                  >
                    {deliveryModal.copiedField === 'Username' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="credential-field-row">
                <span className="cred-label">Password:</span>
                <div className="cred-val-wrap">
                  <span className="cred-val-mono">
                    {deliveryModal.showPassword ? deliveryModal.credential.password : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    className="btn-mini-copy"
                    onClick={() => setDeliveryModal(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  >
                    {deliveryModal.showPassword ? 'Hide' : 'Reveal'}
                  </button>
                  <button 
                    type="button" 
                    className={`btn-mini-copy ${deliveryModal.copiedField === 'Password' ? 'copied' : ''}`}
                    onClick={() => handleCopy(deliveryModal.credential.password, 'Password')}
                  >
                    {deliveryModal.copiedField === 'Password' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* 2FA Key */}
              {deliveryModal.credential.twoFactorKey && (
                <div className="credential-field-row">
                  <span className="cred-label">2FA Secret Key:</span>
                  <div className="cred-val-wrap">
                    <span className="cred-val-mono">{deliveryModal.credential.twoFactorKey}</span>
                    <button 
                      type="button" 
                      className={`btn-mini-copy ${deliveryModal.copiedField === '2FA' ? 'copied' : ''}`}
                      onClick={() => handleCopy(deliveryModal.credential.twoFactorKey, '2FA')}
                    >
                      {deliveryModal.copiedField === '2FA' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mail */}
              {deliveryModal.credential.mail && (
                <div className="credential-field-row">
                  <span className="cred-label">Mail Access:</span>
                  <div className="cred-val-wrap">
                    <span className="cred-val-mono">{deliveryModal.credential.mail}</span>
                    <button 
                      type="button" 
                      className={`btn-mini-copy ${deliveryModal.copiedField === 'Mail' ? 'copied' : ''}`}
                      onClick={() => handleCopy(deliveryModal.credential.mail, 'Mail')}
                    >
                      {deliveryModal.copiedField === 'Mail' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mail Password */}
              {deliveryModal.credential.mailPassword && (
                <div className="credential-field-row">
                  <span className="cred-label">Mail Password:</span>
                  <div className="cred-val-wrap">
                    <span className="cred-val-mono">
                      {deliveryModal.showMailPassword ? deliveryModal.credential.mailPassword : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => setDeliveryModal(prev => ({ ...prev, showMailPassword: !prev.showMailPassword }))}
                    >
                      {deliveryModal.showMailPassword ? 'Hide' : 'Reveal'}
                    </button>
                    <button 
                      type="button" 
                      className={`btn-mini-copy ${deliveryModal.copiedField === 'Mail Password' ? 'copied' : ''}`}
                      onClick={() => handleCopy(deliveryModal.credential.mailPassword, 'Mail Password')}
                    >
                      {deliveryModal.copiedField === 'Mail Password' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Combo String */}
              <div className="combo-string-box">
                <div className="combo-string-label">Full Combo (user:pass:mail:mailpass:2fa):</div>
                <div className="combo-string-val">{deliveryModal.credential.comboString}</div>
              </div>
            </div>

            {/* Delivery Action Buttons */}
            <div className="delivery-actions-row">
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => handleCopy(deliveryModal.credential.comboString, 'Full Combo')}
              >
                📋 Copy Full Combo
              </button>
              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => downloadCredentialsFile(deliveryModal.credential)}
              >
                ⬇️ Download .txt File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2B: BULK PURCHASE DIRECTIVE MODAL (BULK CHECKOUT SUCCESS)
          ========================================================================= */}
      {bulkDirectiveModal.isOpen && (
        <div className="logs-modal-overlay">
          <div className="bulk-directive-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-directive-header">
              <div>
                <h3 className="bulk-directive-title">🎉 Bulk Order Complete!</h3>
                <p className="bulk-directive-subtitle">
                  Successfully dispensed {bulkDirectiveModal.credentials.length} account logs ({siteConfig.formatNaira(bulkDirectiveModal.totalCost)}).
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => setBulkDirectiveModal({ isOpen: false, credentials: [], totalCost: 0 })}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="bulk-directive-content">
              {/* 30-Day Expiry Alert */}
              <div className="bulk-expiry-alert-box">
                <span className="expiry-alert-icon">⏰</span>
                <div className="expiry-alert-text">
                  <strong>30-Day Auto-Purge Notice:</strong> All purchased account logs will be automatically removed from your Chris Shopper history after 30 days for customer privacy. Be sure to back up or download your credentials before then!
                </div>
              </div>

              {/* Directive Information Box */}
              <div className="bulk-directive-info-box">
                <span className="directive-info-icon">📁</span>
                <div className="directive-info-text">
                  <strong>Individual Credentials Ready in Purchase History:</strong>
                  <p>
                    Because you purchased multiple accounts across different platforms with distinct login protocols (Outlook Webmail, 2FA dynamic tokens, proxy rules), each account log has been individually organized in your <strong>Purchase History</strong> where you can copy passwords, generate 2FA tokens, and download .txt files.
                  </p>
                </div>
              </div>

              {/* Summary of Dispensed Accounts */}
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Dispensed Accounts ({bulkDirectiveModal.credentials.length}):
                </div>
                <div className="bulk-purchased-list">
                  {bulkDirectiveModal.credentials.map((cred, idx) => (
                    <div key={cred.id || idx} className="bulk-purchased-item">
                      <div>
                        <span className="bulk-item-user">@{cred.username}</span>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginLeft: '8px' }}>
                          {cred.platform}
                        </span>
                      </div>
                      <span className="font-mono text-green" style={{ fontSize: '0.82rem' }}>
                        {siteConfig.formatNaira(cred.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bulk-directive-footer">
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => {
                  setBulkDirectiveModal({ isOpen: false, credentials: [], totalCost: 0 });
                  if (onNavigateTab) {
                    onNavigateTab('history', 'logs');
                  } else if (isDashboard) {
                    // Fallback
                    window.location.hash = '#history';
                  } else {
                    navigate('/dashboard');
                  }
                }}
              >
                <span>📂 Proceed to Purchase History →</span>
              </button>

              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => downloadBulkCredentialsFile(bulkDirectiveModal.credentials)}
              >
                <span>⬇️ Download All Credentials (.txt Bundle)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SHOPPING CART DRAWER
          ========================================================================= */}
      <LogsCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onRequireAuth={onRequireAuth}
        onShowToast={toast}
        onBulkPurchaseSuccess={(result) => {
          setBulkDirectiveModal({
            isOpen: true,
            credentials: result.credentials,
            totalCost: result.totalCost
          });
          loadInventory();
          if (refreshUser) refreshUser();
          if (onPurchaseComplete) onPurchaseComplete(result.credentials);
        }}
      />
    </section>
  );
}
