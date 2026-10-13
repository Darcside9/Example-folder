import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ServicesSection from './components/ServicesSection';
import LogsMarketplace from './components/LogsMarketplace';
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
import LoadingScreen from './components/LoadingScreen';
import { siteConfig } from './data/siteConfig';
import { useAuth } from './lib/AuthContext';
import { useScrollReveal } from './hooks/useScrollReveal';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize smooth scroll reveal animations across page routes
  useScrollReveal(location.pathname);

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
                <LogsMarketplace 
                  onRequireAuth={() => {
                    navigate('/auth?mode=signup');
                    showToast('Please sign up or log in to buy account logs.');
                  }}
                  onShowToast={showToast}
                />
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

      {/* Floating WhatsApp Support Button (Global across public pages) */}
      {!isWorkstation && (
        <a 
          href={siteConfig.whatsappUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mtel-floating-support-btn"
          title="Chat on WhatsApp"
          aria-label="Direct WhatsApp Support"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
