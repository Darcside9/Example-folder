import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ServicesSection from './components/ServicesSection';
import PricingCatalog from './components/PricingCatalog';
import ApiShowcaseSection from './components/ApiShowcaseSection';
import TrustMetrics from './components/TrustMetrics';
import FaqSection from './components/FaqSection';
import SupportSection from './components/SupportSection';
import Footer from './components/Footer';
import QuickOrderModal from './components/QuickOrderModal';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenOrderModal = (plan = null) => {
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

  const handleTriggerChat = () => {
    showToast('Connecting to Chris Shopper live support queue...');
  };

  return (
    <div className="app-root">
      {/* Sticky Full-Width Navbar */}
      <Navbar onOpenOrderModal={() => handleOpenOrderModal()} />

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

          <ApiShowcaseSection />

          <FaqSection />

          <SupportSection onTriggerChat={handleTriggerChat} />
        </main>

        <Footer />
      </div>

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
