import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetAllUsers, adminUpdateUserBalance, getServices, adminUpdateService } from '../lib/dashboardService';

export default function AdminDashboard({ onShowToast }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'services' | 'orders'
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [newServicePrice, setNewServicePrice] = useState('');

  useEffect(() => {
    async function loadData() {
      const [usrData, srvData] = await Promise.all([
        adminGetAllUsers(),
        getServices()
      ]);
      setUsers(usrData);
      setServices(srvData);
    }
    loadData();
  }, []);

  const handleSaveBalance = async (userId) => {
    if (!newBalanceInput || isNaN(newBalanceInput)) {
      onShowToast('Please enter a valid numeric balance.');
      return;
    }
    await adminUpdateUserBalance(userId, newBalanceInput);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, balance: Number(newBalanceInput).toFixed(2) } : u))
    );
    setEditingUserId(null);
    setNewBalanceInput('');
    onShowToast('User balance updated successfully!');
  };

  const handleToggleService = async (serviceId, currentStatus) => {
    const updated = !currentStatus;
    await adminUpdateService(serviceId, { is_active: updated });
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, is_active: updated } : s))
    );
    onShowToast(`Service ${serviceId} marked as ${updated ? 'Active' : 'Inactive'}!`);
  };

  const handleSavePrice = async (serviceId) => {
    if (!newServicePrice || isNaN(newServicePrice)) {
      onShowToast('Please enter a valid price.');
      return;
    }
    await adminUpdateService(serviceId, { price_usd: Number(newServicePrice) });
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, price_usd: Number(newServicePrice) } : s))
    );
    setEditingServiceId(null);
    setNewServicePrice('');
    onShowToast('Service price updated!');
  };

  return (
    <div className="dashboard-page-wrapper admin-theme">
      {/* Admin Top Header */}
      <div className="dashboard-header-container">
        <div className="dashboard-user-greeting">
          <div className="dash-avatar-circle admin-avatar">👑</div>
          <div>
            <div className="dash-title-row">
              <h2>Admin Master Control Panel</h2>
              <span className="admin-badge-pill">Administrator Access</span>
            </div>
            <p className="dash-email-sub">Direct Database Management & Carrier Platform Control</p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            📱 User Dashboard View
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>
            🏠 Back to Landing Page
          </button>
        </div>
      </div>

      {/* Admin Quick Metrics */}
      <div className="dashboard-metrics-grid">
        <div className="dash-metric-card">
          <span className="dash-metric-label">Total Registered Users</span>
          <span className="dash-metric-val text-cyan">{users.length}</span>
          <span className="dash-metric-sub">Supabase Auth Profiles</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Active Carrier Services</span>
          <span className="dash-metric-val text-green">{services.filter((s) => s.is_active).length} Active</span>
          <span className="dash-metric-sub">Telegram & WhatsApp live</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">WhatsApp Channel</span>
          <span className="dash-metric-val text-green">Online 🟢</span>
          <span className="dash-metric-sub">Direct Customer Chat Hub</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">Supabase Database</span>
          <span className="dash-metric-val text-cyan">Connected ⚡</span>
          <span className="dash-metric-sub">Postgres RLS Policies Active</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="dashboard-nav-tabs">
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management ({users.length})
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          ⚙️ Services & Pricing Catalog
        </button>
        <button 
          type="button" 
          className={`dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📡 Global Orders Stream
        </button>
      </div>

      {/* TAB 1: User Management */}
      {activeTab === 'users' && (
        <div className="dashboard-tab-content">
          <div className="dash-table-card">
            <div className="dash-table-header">
              <h3>Registered Users & Balance Management</h3>
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
                              step="0.50" 
                              value={newBalanceInput} 
                              onChange={(e) => setNewBalanceInput(e.target.value)}
                              className="inline-input"
                              placeholder={u.balance}
                            />
                            <button type="button" className="btn-tiny-save" onClick={() => handleSaveBalance(u.id)}>Save</button>
                            <button type="button" className="btn-tiny-cancel" onClick={() => setEditingUserId(null)}>✕</button>
                          </div>
                        ) : (
                          <strong className="text-cyan">${Number(u.balance || 0).toFixed(2)}</strong>
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

      {/* TAB 2: Services & Pricing Catalog */}
      {activeTab === 'services' && (
        <div className="dashboard-tab-content">
          <div className="dash-table-card">
            <div className="dash-table-header">
              <h3>Service Catalog & Rate Controller</h3>
              <p>Toggle platforms active/coming soon and adjust wholesale pricing in real-time.</p>
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
                  {services.map((srv) => (
                    <tr key={srv.id}>
                      <td><strong>{srv.name}</strong></td>
                      <td>{srv.category}</td>
                      <td>
                        {editingServiceId === srv.id ? (
                          <div className="inline-edit-row">
                            <input 
                              type="number" 
                              step="0.01" 
                              value={newServicePrice} 
                              onChange={(e) => setNewServicePrice(e.target.value)}
                              className="inline-input"
                              placeholder={srv.price_usd}
                            />
                            <button type="button" className="btn-tiny-save" onClick={() => handleSavePrice(srv.id)}>Save</button>
                            <button type="button" className="btn-tiny-cancel" onClick={() => setEditingServiceId(null)}>✕</button>
                          </div>
                        ) : (
                          <span className="font-mono text-cyan">${Number(srv.price_usd).toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${srv.is_active ? 'pill-active' : 'pill-soon'}`}>
                          {srv.is_active ? '🟢 Live & Active' : '⚪ Coming Soon'}
                        </span>
                      </td>
                      <td>{srv.speed || '< 4.5s'}</td>
                      <td>
                        <div className="admin-actions-row">
                          <button 
                            type="button" 
                            className={`btn btn-sm ${srv.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleService(srv.id, srv.is_active)}
                          >
                            {srv.is_active ? 'Pause Service' : 'Activate Service'}
                          </button>
                          {editingServiceId !== srv.id && (
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingServiceId(srv.id);
                                setNewServicePrice(srv.price_usd);
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
        </div>
      )}

      {/* TAB 3: Global Orders Stream */}
      {activeTab === 'orders' && (
        <div className="dashboard-tab-content">
          <div className="dash-table-card">
            <div className="dash-table-header">
              <h3>Global Platform Orders Feed</h3>
              <p>Live stream of incoming verification requests from all users.</p>
            </div>

            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Service</th>
                    <th>Country</th>
                    <th>Phone Line</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">ord_98a7bc</td>
                    <td><strong>TELEGRAM</strong></td>
                    <td>🇺🇸 US</td>
                    <td className="font-mono">+1 (415) 892-0194</td>
                    <td>$0.18</td>
                    <td><span className="status-pill pill-completed">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="font-mono">ord_62fd41</td>
                    <td><strong>WHATSAPP</strong></td>
                    <td>🇺🇸 US</td>
                    <td className="font-mono">+1 (650) 420-9182</td>
                    <td>$0.20</td>
                    <td><span className="status-pill pill-completed">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="font-mono">ord_33da19</td>
                    <td><strong>TELEGRAM</strong></td>
                    <td>🇺🇸 US</td>
                    <td className="font-mono">+1 (312) 773-6401</td>
                    <td>$0.18</td>
                    <td><span className="status-pill pill-pending">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
