import React, { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import LocationModal from './components/LocationModal';
import AuthModal from './components/AuthModal';
import ProductDetailModal from './components/ProductDetailModal';
import PaymentModal from './components/PaymentModal';

import CatalogPage from './pages/CatalogPage';
import BuyerOrdersPage from './pages/BuyerOrdersPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sadaya_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Lokasi Pembeli Default: Kampus UPI Cibiru
  const [currentLocation, setCurrentLocation] = useState({
    lat: -6.932800,
    lng: 107.718500,
    alamat: 'Kampus UPI di Cibiru, Bandung Timur',
  });

  const [activeTab, setActiveTab] = useState('catalog');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);

  // Otomatis login awal sebagai pembeli jika belum login (agar aplikasi langsung siap didemokan)
  useEffect(() => {
    if (!user) {
      handleSwitchUser('pembeli@sadaya.id');
    }
  }, []);

  // Quick switch akun untuk kemudahan pengujian sistem & presentasi dosen
  const handleSwitchUser = async (email) => {
    try {
      const res = await api.post('/login', {
        email,
        password: 'password',
      });
      localStorage.setItem('sadaya_token', res.data.token);
      localStorage.setItem('sadaya_user', JSON.stringify(res.data.user));
      setUser(res.data.user);

      // Arahkan tab sesuai peran
      if (res.data.user.role === 'admin') {
        setActiveTab('admin_dashboard');
      } else if (res.data.user.role === 'penjual') {
        setActiveTab('seller_dashboard');
      } else {
        setActiveTab('catalog');
      }
    } catch (err) {
      console.error('Gagal switch user demo:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('sadaya_token');
    localStorage.removeItem('sadaya_user');
    setUser(null);
    setActiveTab('catalog');
  };

  const handleOrderSuccess = (newOrder) => {
    // Buka modal simulasi pembayaran otomatis
    setPayingOrder(newOrder);
  };

  const handlePaymentSuccess = (updatedOrder) => {
    // Alihkan ke halaman pesanan pembeli
    setActiveTab('buyer_orders');
  };

  return (
    <div className="app-container">
      {/* Navbar Utama */}
      <Navbar
        user={user}
        currentLocation={currentLocation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'catalog' && (
          <CatalogPage
            currentLocation={currentLocation}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
          />
        )}

        {activeTab === 'buyer_orders' && (
          <BuyerOrdersPage
            onOpenPayment={(ord) => setPayingOrder(ord)}
          />
        )}

        {activeTab === 'seller_dashboard' && (
          <SellerDashboardPage
            user={user}
          />
        )}

        {activeTab === 'admin_dashboard' && (
          <AdminDashboardPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            onUserUpdated={(u) => setUser(u)}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'white',
        borderTop: '1px solid #e2e8f0',
        padding: '24px 16px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#64748b',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <strong>Sadaya — Sistem Marketplace Pangan Lokal</strong>
          <p style={{ marginTop: '4px' }}>
            Program Studi Rekayasa Perangkat Lunak • Kampus UPI di Cibiru • Universitas Pendidikan Indonesia
          </p>
        </div>
      </footer>

      {/* MODALS */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onUpdateLocation={(loc) => setCurrentLocation(loc)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          if (u.role === 'admin') setActiveTab('admin_dashboard');
          else if (u.role === 'penjual') setActiveTab('seller_dashboard');
          else setActiveTab('catalog');
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        user={user}
        onOrderSuccess={handleOrderSuccess}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <PaymentModal
        order={payingOrder}
        isOpen={Boolean(payingOrder)}
        onClose={() => setPayingOrder(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
