// ==========================================================================
// CHRIS SHOPPER — OFFICIAL USER DASHBOARD (PARITY WITH MTELSMS APP)
// ==========================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getServices, 
  getUserProfile, 
  getUserOrders, 
  allocateNumberLine, 
  simulateSmsOtp, 
  cancelAndRefundOrder,
  transferFunds,
  requestWhatsAppOtp,
  verifyWhatsAppOtp,
  requestEmailOtp,
  verifyEmailOtp,
  updateUserPassword
} from '../lib/dashboardService';
import { siteConfig } from '../data/siteConfig';
import LogsMarketplace from './LogsMarketplace';
import { getPurchasedLogs, downloadCredentialsFile } from '../lib/logsService';

export default function UserDashboard({ user, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState('receive-sms'); // 'receive-sms' | 'logs' | 'add-funds' | 'transfer' | 'history' | 'news' | 'settings'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User and Balance State
  const [currentUser, setCurrentUser] = useState(user);
  const [balance, setBalance] = useState(user?.balance || 10.00);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeLines, setActiveLines] = useState([]);
  const [purchasedLogsList, setPurchasedLogsList] = useState([]);
  const [historySubTab, setHistorySubTab] = useState('sms'); // 'sms' | 'logs'
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all'); // 'all' | 'active'
  const [selectedServiceForRent, setSelectedServiceForRent] = useState(null);

  // Settings & Security States
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    type: null, // 'phone' | 'email'
    target: '',
    code: '',
    resendSeconds: 60,
    loading: false,
    error: null,
  });

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

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer;
    if (otpModal.isOpen && otpModal.resendSeconds > 0) {
      timer = setInterval(() => {
        setOtpModal(prev => ({ ...prev, resendSeconds: prev.resendSeconds - 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpModal.isOpen, otpModal.resendSeconds]);

  // Handle URL tab param (e.g. /dashboard?tab=logs)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['receive-sms', 'logs', 'history', 'news', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // 1. Initial Data Fetching from Supabase & Local Storage
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

        // Load purchased account logs
        setPurchasedLogsList(getPurchasedLogs(user?.id));
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
    return services.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      const matchesFilter = serviceFilter === 'active' ? s.is_active : true;
      return matchesSearch && matchesFilter;
    });
  }, [services, searchQuery, serviceFilter]);

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

  // --------------------------------------------------------------------------
  // SETTINGS & CREDENTIAL UPDATE HANDLERS WITH OTP VERIFICATION
  // --------------------------------------------------------------------------

  // 1. Initiate WhatsApp Phone Update OTP
  const handleRequestPhoneOtp = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      showToast('❌ Please enter your new WhatsApp phone number.');
      return;
    }
    try {
      showToast('📡 Dispatching WhatsApp verification code...');
      const res = await requestWhatsAppOtp(currentUser?.id, newPhone);
      setOtpModal({
        isOpen: true,
        type: 'phone',
        target: res.target,
        code: '',
        resendSeconds: 60,
        loading: false,
        error: null,
      });
      showToast(`💬 6-digit WhatsApp OTP dispatched to ${res.target}`);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  // 2. Confirm WhatsApp Phone OTP
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (otpModal.code.length !== 6) return;

    setOtpModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await verifyWhatsAppOtp(currentUser?.id, otpModal.target, otpModal.code);
      setCurrentUser(prev => ({
        ...prev,
        whatsapp_contact: res.verifiedNumber,
        contact_info: res.verifiedNumber,
        contact: res.verifiedNumber
      }));
      setOtpModal(prev => ({ ...prev, isOpen: false, loading: false }));
      setNewPhone('');
      showToast(`✅ WhatsApp number successfully updated to ${res.verifiedNumber}!`);
    } catch (err) {
      setOtpModal(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // 3. Initiate Email Update OTP
  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showToast('❌ Please enter your new email address.');
      return;
    }
    try {
      showToast('📡 Dispatching Email confirmation code...');
      const res = await requestEmailOtp(currentUser?.id, newEmail);
      setOtpModal({
        isOpen: true,
        type: 'email',
        target: res.target,
        code: '',
        resendSeconds: 60,
        loading: false,
        error: null,
      });
      showToast(`✉️ 6-digit confirmation code dispatched to ${res.target}`);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  // 4. Confirm Email OTP
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (otpModal.code.length !== 6) return;

    setOtpModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await verifyEmailOtp(currentUser?.id, otpModal.target, otpModal.code);
      setCurrentUser(prev => ({
        ...prev,
        email: res.verifiedEmail
      }));
      setOtpModal(prev => ({ ...prev, isOpen: false, loading: false }));
      setNewEmail('');
      showToast(`✅ Account email successfully updated to ${res.verifiedEmail}!`);
    } catch (err) {
      setOtpModal(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // 5. Update Password via Supabase Auth
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('❌ Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('❌ New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('❌ New passwords do not match. Please verify.');
      return;
    }

    try {
      showToast('🔒 Verifying credentials and updating password...');
      await updateUserPassword(currentUser?.email, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('✅ Password updated successfully! Please keep your credentials secure.');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  // 6. Resend Active OTP
  const handleResendOtp = async () => {
    if (otpModal.resendSeconds > 0) return;
    try {
      showToast('🔄 Dispatching a fresh verification code...');
      if (otpModal.type === 'phone') {
        await requestWhatsAppOtp(currentUser?.id, otpModal.target);
      } else {
        await requestEmailOtp(currentUser?.id, otpModal.target);
      }
      setOtpModal(prev => ({
        ...prev,
        code: '',
        resendSeconds: 60,
        error: null
      }));
      showToast(`✅ New 6-digit code dispatched to ${otpModal.target}`);
    } catch (err) {
      setOtpModal(prev => ({ ...prev, error: err.message }));
    }
  };

  // Lock scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="mtel-dashboard-layout">
      {/* Mobile Sidebar Dimming Backdrop */}
      {sidebarOpen && (
        <div 
          className="dashboard-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ====================================================================
          SIDEBAR NAVIGATION (MTELSMS EXACT ARCHITECTURE)
          ==================================================================== */}
      <aside className={`mtel-sidebar ${sidebarOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Brand & Language */}
        <div className="sidebar-brand-row">
          <a onClick={() => navigate('/')} className="mtel-brand cursor-pointer">
            <span className="brand-chris">Chris</span>
            <span className="brand-highlight">Shopper</span>
            <span className="brand-sms-pill">GATEWAY</span>
          </a>
          <button className="sidebar-lang-btn" type="button">
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
              className={`sidebar-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              <span>Account Logs</span>
              <span className="tag-soon-tiny" style={{ background: '#00e5ff', color: '#000', fontWeight: 700, marginLeft: 'auto' }}>NEW</span>
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
            type="button"
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div className="mobile-brand-title">
            <span className="brand-chris">Chris</span> <span className="brand-highlight">Shopper</span>
          </div>

          <div className="mobile-balance-pill" onClick={() => setShowTopUpModal(true)}>
            ${balance.toFixed(2)} +
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="desktop-dash-topbar">
          <div className="dash-breadcrumb">
            <span className="breadcrumb-root">Chris Shopper</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">
              {activeTab === 'receive-sms' && 'SMS Verifications'}
              {activeTab === 'logs' && 'Social & Platform Account Logs'}
              {activeTab === 'history' && 'Orders & Logs History'}
              {activeTab === 'news' && 'Network Updates'}
              {activeTab === 'settings' && 'Account Settings & Security'}
            </span>
          </div>

          <div className="dash-topbar-actions">
            <button 
              type="button" 
              className="btn-back-website" 
              onClick={() => navigate('/')}
              title="Return to public landing page"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Back to Website</span>
            </button>

            <div className="user-pill-indicator">
              <span className="user-avatar-dot" />
              <span className="user-pill-email">{currentUser?.email || 'Authenticated User'}</span>
              <span className="user-pill-role">{currentUser?.role || 'Member'}</span>
            </div>
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

                {/* Search Bar & Category Filter Pills */}
                <div className="services-search-row">
                  <div className="services-filter-pills">
                    <button 
                      type="button" 
                      className={`btn-service-filter ${serviceFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setServiceFilter('all')}
                    >
                      All
                    </button>
                    <button 
                      type="button" 
                      className={`btn-service-filter ${serviceFilter === 'active' ? 'active' : ''}`}
                      onClick={() => setServiceFilter('active')}
                    >
                      ⚡ Active
                    </button>
                  </div>
                  <div className="service-search-input-box">
                    <input 
                      type="text"
                      placeholder="Search service (e.g. Telegram, WhatsApp)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn-search-icon" type="button" aria-label="Search">
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

        {/* TAB: SOCIAL & PLATFORM ACCOUNT LOGS */}
        {activeTab === 'logs' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>🔑 Social & Platform Account Logs</h2>
              <p>Browse aged accounts with 2FA, Outlook email access, and instant FIFO delivery from live Google Sheets.</p>
            </div>

            <LogsMarketplace 
              isDashboard={true}
              onShowToast={showToast}
              onPurchaseComplete={(newCred) => {
                setPurchasedLogsList(getPurchasedLogs(currentUser?.id));
                if (currentUser?.id) {
                  getUserProfile(currentUser.id).then(profile => {
                    if (profile?.balance !== undefined) setBalance(Number(profile.balance));
                  });
                }
              }}
            />
          </div>
        )}

        {/* TAB 2: HISTORY (FULL LOG) */}
        {activeTab === 'history' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>Order & Dispense History</h2>
              <p>Complete historical log of your carrier number verifications and purchased account credentials.</p>
            </div>

            {/* Sub-tab pills */}
            <div className="services-filter-pills" style={{ marginBottom: '20px' }}>
              <button 
                type="button" 
                className={`btn-service-filter ${historySubTab === 'sms' ? 'active' : ''}`}
                onClick={() => setHistorySubTab('sms')}
              >
                📱 SMS Number Rentals ({orders.length})
              </button>
              <button 
                type="button" 
                className={`btn-service-filter ${historySubTab === 'logs' ? 'active' : ''}`}
                onClick={() => setHistorySubTab('logs')}
              >
                🔑 Purchased Account Logs ({purchasedLogsList.length})
              </button>
            </div>

            {historySubTab === 'sms' ? (
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
                          No previous number orders found.
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
            ) : (
              <div className="dash-table-card">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>PLATFORM</th>
                      <th>USERNAME / UID</th>
                      <th>PASSWORD</th>
                      <th>2FA SECRET</th>
                      <th>MAIL / EMAIL PASS</th>
                      <th>DEMO PRICE</th>
                      <th>PURCHASED</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchasedLogsList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-6 text-muted">
                          No account logs purchased yet. 
                          <button 
                            className="link-cyan" 
                            style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setActiveTab('logs')}
                          >
                            Explore Account Logs →
                          </button>
                        </td>
                      </tr>
                    ) : (
                      purchasedLogsList.map((log) => {
                        const isPwRevealed = revealedPasswords[log.id];
                        return (
                          <tr key={log.id}>
                            <td><strong>{log.platform}</strong></td>
                            <td className="font-mono">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{log.username}</span>
                                <button 
                                  className="btn-cell-copy"
                                  onClick={() => copyToClipboard(log.username, 'Username')}
                                >
                                  Copy
                                </button>
                              </div>
                            </td>
                            <td className="font-mono">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{isPwRevealed ? log.password : '••••••••'}</span>
                                <button 
                                  className="btn-cell-copy"
                                  onClick={() => setRevealedPasswords(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                                >
                                  {isPwRevealed ? 'Hide' : 'Show'}
                                </button>
                                <button 
                                  className="btn-cell-copy"
                                  onClick={() => copyToClipboard(log.password, 'Password')}
                                >
                                  Copy
                                </button>
                              </div>
                            </td>
                            <td className="font-mono" style={{ fontSize: '0.78rem' }}>
                              {log.twoFactorKey ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.twoFactorKey}
                                  </span>
                                  <button 
                                    className="btn-cell-copy"
                                    onClick={() => copyToClipboard(log.twoFactorKey, '2FA Key')}
                                  >
                                    Copy
                                  </button>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="font-mono" style={{ fontSize: '0.78rem' }}>
                              {log.mail ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {log.mail}
                                    </span>
                                    <button 
                                      className="btn-cell-copy"
                                      onClick={() => copyToClipboard(log.mail, 'Email')}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  {log.mailPassword && (
                                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>Pass: {isPwRevealed ? log.mailPassword : '••••••'}</span>
                                      <button 
                                        className="btn-cell-copy"
                                        onClick={() => copyToClipboard(log.mailPassword, 'Mail Pass')}
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="font-mono" style={{ color: '#00e5ff' }}>
                              ${Number(log.price || 1.50).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(log.purchasedAt || Date.now()).toLocaleDateString()}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button 
                                  className="btn-simulate-tiny"
                                  onClick={() => copyToClipboard(log.comboString, 'Combo String')}
                                  title="Copy Combo"
                                >
                                  📋 Combo
                                </button>
                                <button 
                                  className="btn-cell-copy"
                                  onClick={() => downloadCredentialsFile(log)}
                                  title="Download credentials file"
                                >
                                  ⬇️ .txt
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
            )}
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

        {/* TAB 4: SETTINGS & SECURITY */}
        {activeTab === 'settings' && (
          <div className="dash-sub-view">
            <div className="sub-view-header">
              <h2>Account Settings & Security</h2>
              <p>Manage your verified contact credentials, authentication email, and account password.</p>
            </div>

            {/* Account Quick Overview Banner */}
            <div className="account-overview-banner">
              <div className="overview-item">
                <span className="overview-label">ACCOUNT ID</span>
                <span className="overview-val font-mono">{currentUser?.id?.slice(0, 14) || 'cs_usr_live'}...</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">ACCOUNT ROLE</span>
                <span className="role-tag role-user">{currentUser?.role || 'Verified Member'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">AVAILABLE BALANCE</span>
                <span className="overview-val text-green font-mono">${balance.toFixed(2)}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">SECURITY STATUS</span>
                <span className="badge-active-shield">🛡️ OTP Verification Active</span>
              </div>
            </div>

            <div className="settings-cards-stack">
              {/* CARD 1: WHATSAPP PHONE NUMBER */}
              <div className="settings-security-card">
                <div className="card-top-row">
                  <div className="card-icon-box whatsapp-icon-box">
                    💬
                  </div>
                  <div className="card-titles">
                    <h3>WhatsApp Contact Number</h3>
                    <p>Primary line for receiving platform OTPs, verification numbers, and concierge billing support.</p>
                  </div>
                  <span className="badge-verified">✓ Verified Line</span>
                </div>

                <div className="current-credential-box">
                  <span className="cred-label">CURRENT VERIFIED NUMBER</span>
                  <div className="cred-val-row">
                    <span className="cred-val font-mono">
                      {currentUser?.whatsapp_contact || currentUser?.contact_info || currentUser?.contact || '+1 (202) 555-0143'}
                    </span>
                    <button 
                      type="button" 
                      className="btn-copy-cred"
                      onClick={() => copyToClipboard(currentUser?.whatsapp_contact || currentUser?.contact_info || currentUser?.contact || '+1 (202) 555-0143', 'WhatsApp Number')}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRequestPhoneOtp} className="update-cred-form">
                  <label className="form-input-label">Update Phone Number (Requires WhatsApp OTP)</label>
                  <div className="form-input-action-row">
                    <input 
                      type="tel"
                      required
                      placeholder="+1 (415) 892-0194"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="settings-text-input font-mono"
                    />
                    <button type="submit" className="btn btn-primary btn-action-sm">
                      Send WhatsApp OTP 💬
                    </button>
                  </div>
                  <span className="form-hint">A 6-digit confirmation code will be dispatched to verify ownership of the new number.</span>
                </form>
              </div>

              {/* CARD 2: ACCOUNT EMAIL */}
              <div className="settings-security-card">
                <div className="card-top-row">
                  <div className="card-icon-box email-icon-box">
                    ✉️
                  </div>
                  <div className="card-titles">
                    <h3>Account Email Address</h3>
                    <p>Primary authentication email used for account access, security alerts, and system receipts.</p>
                  </div>
                  <span className="badge-verified">✓ Verified Email</span>
                </div>

                <div className="current-credential-box">
                  <span className="cred-label">CURRENT EMAIL ADDRESS</span>
                  <div className="cred-val-row">
                    <span className="cred-val font-mono">{currentUser?.email || 'user@chrisshopper.com'}</span>
                    <button 
                      type="button" 
                      className="btn-copy-cred"
                      onClick={() => copyToClipboard(currentUser?.email || 'user@chrisshopper.com', 'Email Address')}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRequestEmailOtp} className="update-cred-form">
                  <label className="form-input-label">Update Email Address (Requires Email OTP)</label>
                  <div className="form-input-action-row">
                    <input 
                      type="email"
                      required
                      placeholder="new.email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="settings-text-input font-mono"
                    />
                    <button type="submit" className="btn btn-primary btn-action-sm">
                      Send Email OTP ✉️
                    </button>
                  </div>
                  <span className="form-hint">A 6-digit confirmation code will be dispatched to verify your new email address.</span>
                </form>
              </div>

              {/* CARD 3: PASSWORD & CREDENTIAL SECURITY */}
              <div className="settings-security-card">
                <div className="card-top-row">
                  <div className="card-icon-box password-icon-box">
                    🔒
                  </div>
                  <div className="card-titles">
                    <h3>Account Password & Security</h3>
                    <p>Ensure your account remains safe with a secure passphrase (minimum 8 characters).</p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="password-form-grid">
                  <div className="pwd-field-group">
                    <label className="form-input-label">Current Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="settings-text-input"
                    />
                  </div>

                  <div className="pwd-fields-split">
                    <div className="pwd-field-group">
                      <label className="form-input-label">New Password (Min 8 characters)</label>
                      <input 
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="settings-text-input"
                      />
                    </div>

                    <div className="pwd-field-group">
                      <label className="form-input-label">Confirm New Password</label>
                      <input 
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="settings-text-input"
                      />
                    </div>
                  </div>

                  <div className="pwd-submit-row">
                    <button type="submit" className="btn btn-primary btn-action-sm">
                      Update Password 🔒
                    </button>
                    <span className="form-hint">Updated credentials are immediately synchronized with Supabase Auth.</span>
                  </div>
                </form>
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

              {/* Custom Top-Up Amount Input */}
              <div className="custom-topup-row">
                <label className="input-hint">Or specify custom top-up amount ($):</label>
                <div className="custom-topup-input-box">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter custom amount (e.g. 25)"
                    value={topUpAmount || ''}
                    onChange={(e) => setTopUpAmount(Math.max(1, Number(e.target.value) || 0))}
                    className="custom-topup-input font-mono"
                  />
                </div>
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
          OTP VERIFICATION MODAL (SHARED FOR WHATSAPP PHONE & EMAIL)
          ==================================================================== */}
      {otpModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-container otp-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{otpModal.type === 'phone' ? 'Verify WhatsApp Number' : 'Verify Account Email'}</h3>
                <p>Security Verification Code Required</p>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>

            <form onSubmit={otpModal.type === 'phone' ? handleVerifyPhoneOtp : handleVerifyEmailOtp} className="modal-body">
              {otpModal.error && (
                <div className="auth-error-banner">{otpModal.error}</div>
              )}

              <div className="otp-target-banner">
                <span className="otp-target-label">
                  Enter the 6-digit code dispatched to:
                </span>
                <strong className="font-mono text-cyan otp-target-val">{otpModal.target}</strong>
              </div>

              <div className="modal-form-group text-center">
                <label className="form-input-label">6-Digit Verification Code</label>
                <input 
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otpModal.code}
                  onChange={(e) => setOtpModal(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
                  className="otp-code-input font-mono"
                />
              </div>

              <div className="otp-timer-row">
                {otpModal.resendSeconds > 0 ? (
                  <span className="otp-countdown-text">
                    Resend code in <strong className="text-cyan">{otpModal.resendSeconds}s</strong>
                  </span>
                ) : (
                  <button 
                    type="button" 
                    className="btn-resend-link"
                    onClick={handleResendOtp}
                  >
                    🔄 Resend Verification Code
                  </button>
                )}
              </div>

              <button 
                type="submit" 
                disabled={otpModal.code.length !== 6 || otpModal.loading}
                className="btn btn-primary btn-full btn-lg"
              >
                {otpModal.loading ? 'Verifying...' : `Confirm & Update ${otpModal.type === 'phone' ? 'Phone Number' : 'Email'}`}
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
