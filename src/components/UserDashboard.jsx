// ==========================================================================
// CHRIS SHOPPER — OFFICIAL USER DASHBOARD (PARITY WITH MTELSMS APP)
// ==========================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getServices, 
  getUserProfile, 
  getUserOrders, 
  allocateNumberLine, 
  simulateSmsOtp, 
  cancelAndRefundOrder,
  transferFunds
} from '../lib/dashboardService';
import { siteConfig } from '../data/siteConfig';

export default function UserDashboard({ user, onSignOut }) {
  const navigate = useNavigate();
  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState('receive-sms'); // 'receive-sms' | 'add-funds' | 'transfer' | 'history' | 'api' | 'news' | 'settings'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live Data State
  const [balance, setBalance] = useState(user?.balance || 10.00);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeLines, setActiveLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceForRent, setSelectedServiceForRent] = useState(null);

  // Modals & Feedback
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(10);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState(5);
  const [transferError, setTransferError] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [timers, setTimers] = useState({});

  // 1. Initial Data Fetching from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [srvs, profile, userOrders] = await Promise.all([
          getServices(),
          user?.id ? getUserProfile(user.id) : null,
          user?.id ? getUserOrders(user.id) : []
        ]);

        setServices(srvs);
        if (profile?.balance !== undefined) {
          setBalance(Number(profile.balance));
        }
        setOrders(userOrders);

        // Filter currently active / pending orders
        const pending = userOrders.filter(o => o.status === 'pending' || o.status === 'code_received');
        setActiveLines(pending);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // 2. Countdown Timer Loop for Active Lines
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        activeLines.forEach(line => {
          const expiresAt = line.expires_at ? new Date(line.expires_at).getTime() : (line._localCreatedAt || Date.now()) + 15 * 60 * 1000;
          const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          updated[line.id] = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLines]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    showToast(`${label}: ${text}`);
  };

  // Filtered Services List
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }, [services, searchQuery]);

  // Handle Rent Service
  const handleRentService = async (service) => {
    if (!service.is_active) {
      // Direct WhatsApp request for inactive service
      const waUrl = siteConfig.getWhatsAppSupportUrl(`Hi Chris Shopper, I would like to request activation for the service: ${service.name}`);
      window.open(waUrl, '_blank');
      return;
    }

    if (balance < service.price) {
      setShowTopUpModal(true);
      return;
    }

    try {
      showToast(`Allocating ${service.name} number line...`);
      const { order, newBalance } = await allocateNumberLine({
        userId: user?.id || 'demo_user',
        service,
        country: 'us',
        currentBalance: balance
      });

      setBalance(newBalance);
      order._localCreatedAt = Date.now();
      setActiveLines(prev => [order, ...prev]);
      setOrders(prev => [order, ...prev]);
      showToast(`✅ Allocated ${service.name} line: ${order.phone_number}`);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  // Simulate Incoming SMS OTP
  const handleSimulateSms = async (lineId) => {
    const target = activeLines.find(l => l.id === lineId);
    if (!target) return;

    showToast('📡 Routing simulated carrier SMS packet...');
    const result = await simulateSmsOtp(lineId);

    setActiveLines(prev => prev.map(l => {
      if (l.id === lineId) {
        return {
          ...l,
          status: 'code_received',
          sms_code: result.code,
          message_body: result.messageBody
        };
      }
      return l;
    }));

    showToast(`📩 OTP Received: ${result.code}`);
  };

  // Cancel & Refund Line
  const handleCancelLine = async (line) => {
    const newBal = await cancelAndRefundOrder({
      orderId: line.id,
      userId: user?.id || 'demo_user',
      cost: Number(line.cost) || 0.18,
      currentBalance: balance
    });

    setBalance(newBal);
    setActiveLines(prev => prev.filter(l => l.id !== line.id));
    setOrders(prev => prev.map(o => o.id === line.id ? { ...o, status: 'refunded' } : o));
    showToast(`💰 Line cancelled. $${line.cost} refunded to your balance.`);
  };

  // Handle Fund Transfer Submit
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const res = await transferFunds({
        senderId: user?.id,
        recipientEmail: transferEmail,
        amount: Number(transferAmount),
        currentBalance: balance
      });

      setBalance(res.newBalance);
      setTransferSuccess(`Successfully transferred $${transferAmount} to ${res.recipientEmail}!`);
      setTransferEmail('');
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(null);
      }, 2000);
    } catch (err) {
      setTransferError(err.message || 'Transfer failed.');
    }
  };

  return (
    <div className="mtel-dashboard-layout">
      {/* ====================================================================
          SIDEBAR NAVIGATION (MTELSMS EXACT ARCHITECTURE)
          ==================================================================== */}
      <aside className={`mtel-sidebar ${sidebarOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Brand & Language */}
        <div className="sidebar-brand-row">
          <a onClick={() => navigate('/')} className="mtel-brand cursor-pointer">
            <span className="brand-chris">Chris</span>
            <span className="brand-sms-pill">SMS</span>
          </a>
          <button className="sidebar-lang-btn">
            <span>EN</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Current Balance Box */}
        <div className="sidebar-balance-box">
          <div className="balance-box-left">
            <span className="balance-sub-label">CURRENT BALANCE</span>
            <span className="balance-currency-val">${balance.toFixed(2)}</span>
          </div>
          <button 
            className="btn-topup-gradient"
            onClick={() => setShowTopUpModal(true)}
          >
            Top up +
          </button>
        </div>

        {/* MAIN Navigation */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">MAIN</div>
          <nav className="sidebar-nav-list">
            <button 
              className={`sidebar-nav-item ${activeTab === 'receive-sms' ? 'active' : ''}`}
              onClick={() => { setActiveTab('receive-sms'); setSidebarOpen(false); }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span>Receive SMS</span>
            </button>

            <button 
              className="sidebar-nav-item"
              onClick={() => setShowTopUpModal(true)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              <span>Add Funds</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => setShowTransferModal(true)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              <span>Fund Transfer</span>
            </button>
          </nav>
        </div>

        {/* SECONDARY Navigation */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">SECONDARY</div>
          <nav className="sidebar-nav-list">
            <a 
              href={siteConfig.getWhatsAppSupportUrl('Hi Chris Shopper, I need help with my account/SMS verification')}
              target="_blank" 
              rel="noopener noreferrer"
              className="sidebar-nav-item"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/>
              </svg>
              <span>Support Center</span>
            </a>

            <button 
              className={`sidebar-nav-item ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => { setActiveTab('news'); setSidebarOpen(false); }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              <span>News & Updates</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              <span>History</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => { setActiveTab('api'); setSidebarOpen(false); }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              <span>API</span>
            </button>
          </nav>
        </div>

        {/* ACCOUNT / FOOTER Controls */}
        <div className="sidebar-footer-group">
          {user?.role === 'admin' && (
            <button 
              className="sidebar-nav-item admin-highlight-link"
              onClick={() => navigate('/admin')}
            >
              <span>👑 Admin Panel</span>
            </button>
          )}

          <button 
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </button>

          <button 
            className="sidebar-nav-item text-danger"
            onClick={onSignOut}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          MAIN DASHBOARD BODY AREA
          ==================================================================== */}
      <main className="mtel-main-content">
        {/* Mobile Top Header */}
        <header className="mobile-dash-header">
          <button 
            className="mobile-hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div className="mobile-brand-title">
            <span className="brand-chris">Chris</span> <span className="brand-sms-pill">SMS</span>
          </div>

          <div className="mobile-balance-pill" onClick={() => setShowTopUpModal(true)}>
            ${balance.toFixed(2)} +
          </div>
        </header>

        {/* TAB 1: RECEIVE SMS (2-COLUMN GRID LIKE MTELSMS) */}
        {activeTab === 'receive-sms' && (
          <div className="dashboard-two-col-grid">
            {/* ---------------- LEFT COLUMN: SMS Verifications & Services ---------------- */}
            <div className="dash-col-left">
              <h2 className="dash-col-title">SMS Verifications</h2>

              {/* Service Info Box */}
              <div className="info-guideline-box">
                <div className="info-box-header">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span>Service Info</span>
                </div>
                <ul className="info-bullet-list">
                  <li>Click service name to rent number.</li>
                  <li>
                    Service not listed ? <a href={siteConfig.getWhatsAppSupportUrl('Hi Chris Shopper, I would like to request adding a new SMS service')} target="_blank" rel="noopener noreferrer" className="link-cyan">Send request to add.</a>
                  </li>
                  <li>
                    For fixed or bulk price <a href={siteConfig.getWhatsAppSupportUrl('Hi Chris Shopper, I am inquiring about wholesale bulk pricing')} target="_blank" rel="noopener noreferrer" className="link-cyan">Contact support.</a>
                  </li>
                </ul>
              </div>

              {/* Available Services Card */}
              <div className="services-catalog-panel">
                <h3 className="services-panel-heading">Available Services</h3>

                {/* Search Bar */}
                <div className="services-search-row">
                  <button className="btn-service-filter active">Service</button>
                  <div className="service-search-input-box">
                    <input 
                      type="text"
                      placeholder="Search service..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn-search-icon" onClick={() => {}}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Services Table */}
                <div className="services-table-wrapper">
                  <table className="services-catalog-table">
                    <thead>
                      <tr>
                        <th className="th-service">SERVICE</th>
                        <th className="th-retail">Retail</th>
                        <th className="th-wholesale">Wholesale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map(srv => {
                        const isActive = srv.is_active;
                        return (
                          <tr 
                            key={srv.id} 
                            className={`service-tr-row ${isActive ? 'service-row-active' : 'service-row-soon'}`}
                            onClick={() => handleRentService(srv)}
                            title={isActive ? `Rent ${srv.name} ($${srv.price.toFixed(2)})` : 'Service Coming Soon / Request on WhatsApp'}
                          >
                            <td className="td-service-name">
                              <span className={`srv-indicator-dot ${isActive ? 'active' : 'inactive'}`}></span>
                              <strong>{srv.name}</strong>
                              {!isActive && <span className="tag-soon-tiny">SOON</span>}
                            </td>
                            <td className="td-retail-price">
                              {srv.retailPrice ? <span className="retail-strike">Retail Price: ${srv.retailPrice.toFixed(2)}</span> : '-'}
                            </td>
                            <td className="td-wholesale-price">
                              <span className={isActive ? 'price-active-bold' : 'price-soon-sub'}>
                                ${srv.price.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredServices.length === 0 && (
                        <tr>
                          <td colSpan="3" className="no-services-found">
                            No services matching "{searchQuery}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ---------------- RIGHT COLUMN: Rented Numbers & Active Rentals ---------------- */}
            <div className="dash-col-right">
              <h2 className="dash-col-title">Rented Numbers</h2>

              {/* Usage Guidelines Box */}
              <div className="info-guideline-box">
                <div className="info-box-header">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span>Usage Guidelines</span>
                </div>
                <ul className="info-bullet-list">
                  <li>If you don't receive the code, you'll get an instant refund.</li>
                  <li>If the code appears incorrect, feel free to report it to our support team.</li>
                  <li>
                    <a href={siteConfig.getWhatsAppSupportUrl('Hi Chris Shopper, I am inquiring about wholesale custom rates')} target="_blank" rel="noopener noreferrer" className="link-cyan">Contact support</a> for wholesale prices.
                  </li>
                </ul>
              </div>

              {/* Active Rentals Panel */}
              <div className="active-rentals-panel">
                <h3 className="services-panel-heading">Active Rentals</h3>

                <div className="rentals-table-wrapper">
                  <table className="rentals-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>SERVICE</th>
                        <th>PHONE</th>
                        <th>CODE</th>
                        <th>COST</th>
                        <th>TIME</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLines.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="no-active-rentals-td">
                            <div className="empty-rentals-msg">
                              <p>No active or waiting numbers found</p>
                              <button 
                                className="link-history-btn"
                                onClick={() => setActiveTab('history')}
                              >
                                View number history
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        activeLines.map(line => {
                          const timeRemaining = timers[line.id] || '14:59';
                          const hasCode = line.status === 'code_received' && line.sms_code;

                          return (
                            <tr key={line.id} className="active-rental-row">
                              <td className="font-mono text-muted">#{line.id.toString().slice(-5)}</td>
                              <td>
                                <span className="rental-srv-badge">{line.service_name}</span>
                              </td>
                              <td className="font-mono">
                                <div className="phone-copy-cell">
                                  <span>{line.phone_number}</span>
                                  <button 
                                    className="btn-cell-copy"
                                    onClick={() => copyToClipboard(line.phone_number, 'Phone Number')}
                                    title="Copy Number"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </td>
                              <td>
                                {hasCode ? (
                                  <div className="code-received-cell">
                                    <span className="code-bold-green">{line.sms_code}</span>
                                    <button 
                                      className="btn-cell-copy-otp"
                                      onClick={() => copyToClipboard(line.sms_code, 'OTP Code')}
                                    >
                                      Copy Code
                                    </button>
                                  </div>
                                ) : (
                                  <div className="waiting-pulse-cell">
                                    <span className="waiting-dot-pulse"></span>
                                    <span>Waiting...</span>
                                  </div>
                                )}
                              </td>
                              <td className="font-mono">${Number(line.cost || 0.18).toFixed(2)}</td>
                              <td className="font-mono time-timer-cell">{timeRemaining}</td>
                              <td>
                                <div className="rental-actions-group">
                                  {!hasCode && (
                                    <button 
                                      className="btn-simulate-tiny"
                                      onClick={() => handleSimulateSms(line.id)}
                                      title="Simulate SMS Arrival for Test"
                                    >
                                      ⚡ Simulate
                                    </button>
                                  )}
                                  <button 
                                    className="btn-cancel-tiny"
                                    onClick={() => handleCancelLine(line)}
                                    title="Cancel and Refund"
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORY (FULL LOG) */}
        {activeTab === 'history' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>Rental History</h2>
              <p>Complete historical log of your carrier number verifications.</p>
            </div>

            <div className="dash-table-card">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>SERVICE</th>
                    <th>PHONE NUMBER</th>
                    <th>SMS CODE</th>
                    <th>COST</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-muted">
                        No previous orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id}>
                        <td className="font-mono">#{order.id.toString().slice(-6)}</td>
                        <td><strong>{order.service_name}</strong></td>
                        <td className="font-mono">{order.phone_number}</td>
                        <td className="font-mono">
                          {order.sms_code ? (
                            <span className="text-green font-bold">{order.sms_code}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="font-mono">${Number(order.cost || 0).toFixed(2)}</td>
                        <td>
                          <span className={`status-pill pill-${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: API & DEVELOPER */}
        {activeTab === 'api' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>Developer API Integration</h2>
              <p>Automate USA virtual number provisioning via JSON REST endpoints.</p>
            </div>

            <div className="api-dash-card">
              <div className="api-key-box">
                <span className="api-key-label">YOUR REST API KEY</span>
                <div className="api-key-row">
                  <input 
                    type="text" 
                    readOnly 
                    value={`cs_live_${user?.id ? user.id.replace(/-/g, '').slice(0, 24) : 'e849204859a0fbc'}`} 
                    className="api-key-input"
                  />
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(`cs_live_${user?.id ? user.id.replace(/-/g, '').slice(0, 24) : 'e849204859a0fbc'}`, 'API Key')}
                  >
                    Copy Key
                  </button>
                </div>
              </div>

              <h3>1. Request Instant Number</h3>
              <div className="code-block">
                {`curl -X POST https://api.chrisshopper.com/v1/rent \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"service": "telegram", "country": "us"}'`}
              </div>

              <h3>2. Retrieve Received SMS Code</h3>
              <div className="code-block">
                {`curl -X GET https://api.chrisshopper.com/v1/sms/ord_948201 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NEWS & CARRIER UPDATES */}
        {activeTab === 'news' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>Platform News & Network Updates</h2>
              <p>Real-time updates regarding carrier routing and pricing optimizations.</p>
            </div>

            <div className="news-cards-list">
              <div className="news-item-card">
                <div className="news-date-badge">August 2026</div>
                <h3>🚀 Enhanced Telegram & WhatsApp High-Speed Routing</h3>
                <p>We've deployed direct non-VoIP tier 1 carrier interconnects, delivering SMS verification codes with average delivery times under 3.5 seconds.</p>
              </div>

              <div className="news-item-card">
                <div className="news-date-badge">August 2026</div>
                <h3>⚡ Zero-Fee WhatsApp Direct Top-Ups Enabled</h3>
                <p>Users can now instant top-up their balance through WhatsApp with zero intermediary payment gateway deductions.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>Account Settings & WhatsApp Handle</h2>
              <p>Manage your account credentials and contact details.</p>
            </div>

            <div className="account-dash-card">
              <div className="account-details-grid">
                <div className="account-item">
                  <span className="item-label">Account Email</span>
                  <strong>{user?.email}</strong>
                </div>
                <div className="account-item">
                  <span className="item-label">WhatsApp Contact Handle</span>
                  <strong>{user?.whatsapp_contact || '+1 (202) 555-0143'}</strong>
                </div>
                <div className="account-item">
                  <span className="item-label">Available Balance</span>
                  <strong className="text-green font-mono">${balance.toFixed(2)}</strong>
                </div>
                <div className="account-item">
                  <span className="item-label">Account Role</span>
                  <strong className="role-tag role-user">{user?.role || 'Verified Member'}</strong>
                </div>
              </div>

              <div className="whatsapp-help-box">
                <h4>Need to change your WhatsApp contact number or request custom limits?</h4>
                <p>Message our concierge directly on WhatsApp for immediate profile updates and custom billing solutions.</p>
                <a 
                  href={siteConfig.getWhatsAppSupportUrl('Hi Chris Shopper, I would like to update my account details')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm w-fit"
                >
                  Contact on WhatsApp 💬
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          TOP UP ON WHATSAPP MODAL
          ==================================================================== */}
      {showTopUpModal && (
        <div className="modal-backdrop" onClick={() => setShowTopUpModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Add Funds & Balance Top-Up</h3>
                <p>Instant Direct WhatsApp Payment</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTopUpModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="topup-options-grid">
                {[5, 10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className={`topup-amt-pill ${topUpAmount === amt ? 'active' : ''}`}
                    onClick={() => setTopUpAmount(amt)}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="topup-summary-box">
                <div className="summary-row">
                  <span>Selected Amount:</span>
                  <strong>${topUpAmount}.00</strong>
                </div>
                <div className="summary-row">
                  <span>Target Account:</span>
                  <span className="font-mono">{user?.email}</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total Due:</span>
                  <span className="total-amount">${topUpAmount}.00</span>
                </div>
              </div>

              <a
                href={siteConfig.getWhatsAppTopUpUrl(topUpAmount, user?.email)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-full btn-lg"
                onClick={() => setShowTopUpModal(false)}
              >
                Proceed to WhatsApp Top Up 💬
              </a>
              <p className="modal-guarantee-text">
                🔒 Direct admin processing • Balance credited immediately upon WhatsApp confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          FUND TRANSFER MODAL
          ==================================================================== */}
      {showTransferModal && (
        <div className="modal-backdrop" onClick={() => setShowTransferModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Transfer Funds to User</h3>
                <p>Send balance directly to another member</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="modal-body">
              {transferError && (
                <div className="auth-error-banner">{transferError}</div>
              )}
              {transferSuccess && (
                <div className="active-service-notice">{transferSuccess}</div>
              )}

              <div className="modal-form-group">
                <label>Recipient Email</label>
                <input 
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="modal-select"
                />
              </div>

              <div className="modal-form-group">
                <label>Amount ($)</label>
                <input 
                  type="number"
                  min="0.10"
                  step="0.10"
                  max={balance}
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="modal-select"
                />
                <span className="input-hint">Your available balance: ${balance.toFixed(2)}</span>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg">
                Confirm Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          FLOATING WHATSAPP SUPPORT ICON (BOTTOM RIGHT)
          ==================================================================== */}
      <a 
        href={siteConfig.whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mtel-floating-support-btn"
        title="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ====================================================================
          TOAST NOTIFICATION
          ==================================================================== */}
      {toastMessage && (
        <div className="toast-notification">
          <span className="toast-icon">⚡</span>
          <span className="toast-msg">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
