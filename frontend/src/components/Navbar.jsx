import React from 'react';
import api from '../api';

export default function Navbar({
  user,
  currentLocation,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenLocation,
  onSwitchUser,
  onLogout,
}) {
  return (
    <>
      {/* Top Banner: Quick Role Switcher untuk Pengujian SRS & Penunjuk Lokasi */}
      <div className="top-banner">
        <div className="top-banner-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>📍 Lokasi Anda (UC-03):</span>
            <button
              type="button"
              className="location-chip"
              onClick={onOpenLocation}
              title="Klik untuk ubah lokasi GPS atau manual"
            >
              <span>🛰️ {currentLocation.alamat || 'Cibiru, Bandung Timur'}</span>
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>[Ubah]</span>
            </button>
          </div>

          <div className="quick-switch">
            <span className="switch-label">⚡ Uji Cepat Peran (Demo):</span>
            <button
              type="button"
              className={`chip-btn ${user?.email === 'pembeli@sadaya.id' ? 'active-role' : ''}`}
              onClick={() => onSwitchUser('pembeli@sadaya.id')}
              title="Masuk sebagai Pembeli (Azka - Cibiru)"
            >
              🛒 Pembeli
            </button>
            <button
              type="button"
              className={`chip-btn ${user?.email === 'tani_makmur@sadaya.id' ? 'active-role' : ''}`}
              onClick={() => onSwitchUser('tani_makmur@sadaya.id')}
              title="Masuk sebagai Penjual Terverifikasi (Tani Makmur Cibiru)"
            >
              🌾 Penjual (Aktif)
            </button>
            <button
              type="button"
              className={`chip-btn ${user?.email === 'penjual_baru@sadaya.id' ? 'active-role' : ''}`}
              onClick={() => onSwitchUser('penjual_baru@sadaya.id')}
              title="Masuk sebagai Penjual Menunggu Verifikasi"
            >
              ⏳ Penjual (Pending)
            </button>
            <button
              type="button"
              className={`chip-btn ${user?.email === 'admin@sadaya.id' ? 'active-role' : ''}`}
              onClick={() => onSwitchUser('admin@sadaya.id')}
              title="Masuk sebagai Admin Sistem"
            >
              👑 Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-logo" onClick={() => setActiveTab('catalog')}>
            <div className="brand-icon">🌱</div>
            <div>
              <span className="brand-title">Sadaya</span>
              <span className="brand-subtitle">Marketplace Pangan Lokal</span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              type="button"
              className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              🌾 Katalog Pangan
            </button>

            {/* Menu Khusus Pembeli */}
            {user?.role === 'pembeli' && (
              <button
                type="button"
                className={`nav-btn ${activeTab === 'buyer_orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('buyer_orders')}
              >
                🛍️ Pesanan Saya
              </button>
            )}

            {/* Menu Khusus Penjual */}
            {user?.role === 'penjual' && (
              <button
                type="button"
                className={`nav-btn ${activeTab === 'seller_dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('seller_dashboard')}
              >
                🏪 Kelola Lapak & Pesanan
              </button>
            )}

            {/* Menu Khusus Admin */}
            {user?.role === 'admin' && (
              <button
                type="button"
                className={`nav-btn ${activeTab === 'admin_dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin_dashboard')}
              >
                🛡️ Panel Administrator
              </button>
            )}

            {/* Menu Akun / Profil (UC-15) */}
            {user ? (
              <>
                <button
                  type="button"
                  className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  👤 {user.name.split(' ')[0]} ({user.role})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onLogout}
                >
                  Keluar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenAuth}
              >
                Masuk / Daftar
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
