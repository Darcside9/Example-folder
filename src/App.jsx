import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ServicesSection from './components/ServicesSection';
import PricingCatalog from './components/PricingCatalog';
import TrustMetrics from './components/TrustMetrics';
import FaqSection from './components/FaqSection';
import SupportSection from './components/SupportSection';
import Footer from './components/Footer';
import QuickOrderModal from './components/QuickOrderModal';
import AuthView from './components/AuthView';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './lib/AuthContext';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isWorkstation = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenOrderModal = (plan = null) => {
    if (!currentUser) {
      navigate('/auth?mode=signup');
      showToast('Please create an account or sign in to buy numbers.');
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleOrderSuccess = (serviceName) => {
    showToast(`Virtual line allocated for ${serviceName}! Check dashboard.`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    showToast('Signed out successfully.');
  };

  return (
    <div className="app-root">
      {/* Top Navbar: only for public marketing routes */}
      {!isWorkstation && (
        <Navbar 
          onOpenOrderModal={() => handleOpenOrderModal()} 
        />
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            <div className="page-shell">
              <main>
                <Hero onOpenOrderModal={() => handleOpenOrderModal()} />
                <TrustMetrics />
                <HowItWorks />
                <ServicesSection onSelectService={() => handleOpenOrderModal()} />
                <PricingCatalog 
                  onSelectPlan={(plan) => handleOpenOrderModal(plan)}
                  onNotifySoon={(serviceName) => showToast(`You'll be notified when ${serviceName} numbers go live!`)}
                />
                <FaqSection />
                <SupportSection />
              </main>
              <Footer />
            </div>
          } 
        />
        <Route 
          path="/auth" 
          element={<AuthView />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <UserDashboard
                user={currentUser}
                onSignOut={handleLogout}
                onShowToast={showToast}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard
                onShowToast={showToast}
              />
            </AdminRoute>
          } 
        />
      </Routes>

      {/* Interactive Quick Order / Allocation Modal */}
      <QuickOrderModal
        isOpen={isModalOpen}
        onClose={handleCloseOrderModal}
        initialPlan={selectedPlan}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Global Toast Feedback */}
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span className="toast-icon">⚡</span>
          <span className="toast-msg">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
