import React, { useState, useEffect } from 'react';
import api from '../api';

export default function SellerDashboardPage({ user, onUserUpdated }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'payouts'
  const [loading, setLoading] = useState(true);

  // Modal Tambah/Edit Produk (UC-10)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nama_produk: '',
    kategori: 'Beras & Biji-bijian',
    harga: '',
    stok: '',
    minimum_pembelian: '1',
    deskripsi: '',
    foto: '',
    status_aktif: true,
  });
  const [productError, setProductError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Modal Kirim Pesanan
  const [shippingOrder, setShippingOrder] = useState(null);
  const [kurir, setKurir] = useState('Kurir Tani Mandiri');
  const [nomorResi, setNomorResi] = useState('');
  const [estimasiHari, setEstimasiHari] = useState('2');
  const [shippingLoading, setShippingLoading] = useState(false);

  const isVerified = user?.status_verifikasi === 'Terverifikasi';

  // Template cepat produk pangan untuk mempermudah listing
  const quickTemplates = [
    {
      nama_produk: 'Beras Rojolele Delanggu Super',
      kategori: 'Beras & Biji-bijian',
      harga: 14500,
      stok: 300,
      minimum_pembelian: 5,
      deskripsi: 'Beras lokal wangi, pulen alami, panen baru langsung dari petani.',
      foto: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    },
    {
      nama_produk: 'Cabai Rawit Merah Domba',
      kategori: 'Bumbu & Rempah',
      harga: 42000,
      stok: 60,
      minimum_pembelian: 1,
      deskripsi: 'Cabai rawit merah segar super pedas, petik pagi hari tanpa pestisida kimia berlebih.',
      foto: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    },
    {
      nama_produk: 'Telur Ayam Kampung Asli',
      kategori: 'Daging & Telur',
      harga: 35000,
      stok: 100,
      minimum_pembelian: 1,
      deskripsi: 'Telur ayam kampung segar dari peternakan umbaran bebas (free-range).',
      foto: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
    },
    {
      nama_produk: 'Sayur Bayam Hijau Organik',
      kategori: 'Sayuran',
      harga: 6000,
      stok: 80,
      minimum_pembelian: 2,
      deskripsi: 'Bayam segar hidroponik bebas ulat dan pestisida, kaya zat besi.',
      foto: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
    },
    {
      nama_produk: 'Bawang Merah Brebes Super',
      kategori: 'Bumbu & Rempah',
      harga: 32000,
      stok: 150,
      minimum_pembelian: 3,
      deskripsi: 'Bawang merah Brebes umbi padat, kering jemur sempurna, aroma wangi gurih.',
      foto: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        api.get('/seller/products'),
        api.get('/seller/orders'),
      ]);
      setProducts(prodRes.data.data || []);
      setOrders(ordRes.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data lapak:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Verifikasi Instan untuk Kemudahan Demo / Testing Penjual
  const handleQuickVerify = async () => {
    try {
      const res = await api.post('/seller/quick-verify');
      alert(res.data.message);
      if (onUserUpdated) {
        onUserUpdated(res.data.user);
      }
      localStorage.setItem('sadaya_user', JSON.stringify(res.data.user));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal verifikasi.');
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormData({
      nama_produk: '',
      kategori: 'Beras & Biji-bijian',
      harga: '',
      stok: '',
      minimum_pembelian: '1',
      deskripsi: '',
      foto: '',
      status_aktif: true,
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const applyTemplate = (tpl) => {
    setFormData({
      nama_produk: tpl.nama_produk,
      kategori: tpl.kategori,
      harga: String(tpl.harga),
      stok: String(tpl.stok),
      minimum_pembelian: String(tpl.minimum_pembelian),
      deskripsi: tpl.deskripsi,
      foto: tpl.foto,
      status_aktif: true,
    });
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      nama_produk: prod.nama_produk,
      kategori: prod.kategori,
      harga: String(prod.harga),
      stok: String(prod.stok),
      minimum_pembelian: String(prod.minimum_pembelian),
      deskripsi: prod.deskripsi || '',
      foto: prod.foto || '',
      status_aktif: Boolean(prod.status_aktif),
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductError('');

    // Validasi form lengkap (Exception Flow UC-10)
    if (!formData.nama_produk.trim()) {
      setProductError('Nama produk wajib diisi.');
      return;
    }
    if (!formData.harga || parseFloat(formData.harga) <= 0) {
      setProductError('Harga produk harus lebih dari 0.');
      return;
    }
    if (formData.stok === '' || parseInt(formData.stok, 10) < 0) {
      setProductError('Stok produk wajib diisi angka valid (minimal 0).');
      return;
    }
    if (!formData.minimum_pembelian || parseInt(formData.minimum_pembelian, 10) < 1) {
      setProductError('Batas minimum pembelian minimal 1.');
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        nama_produk: formData.nama_produk.trim(),
        kategori: formData.kategori,
        harga: parseFloat(formData.harga),
        stok: parseInt(formData.stok, 10),
        minimum_pembelian: parseInt(formData.minimum_pembelian, 10),
        deskripsi: formData.deskripsi.trim() || null,
        foto: formData.foto.trim() || null,
        status_aktif: formData.status_aktif,
      };

      if (editingProduct) {
        await api.put(`/seller/products/${editingProduct.id}`, payload);
        alert('Produk berhasil diperbarui.');
      } else {
        await api.post('/seller/products', payload);
        alert('Produk pangan baru berhasil didaftarkan ke lapak Anda.');
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      setProductError(err.response?.data?.message || 'Gagal menyimpan produk.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini dari lapak Anda?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  // Mulai Proses Pesanan ('Menunggu Pembayaran' / 'Dibayar' -> 'Diproses')
  const handleProcessOrder = async (orderId) => {
    try {
      const res = await api.post(`/seller/orders/${orderId}/process`);
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pesanan.');
    }
  };

  // Kirim Pesanan ('Diproses' -> 'Dikirim')
  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!shippingOrder) return;

    setShippingLoading(true);
    try {
      const res = await api.post(`/seller/orders/${shippingOrder.id}/ship`, {
        kurir,
        nomor_resi: nomorResi || undefined,
        estimasi_hari: parseInt(estimasiHari, 10),
      });
      alert(res.data.message);
      setShippingOrder(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim pesanan.');
    } finally {
      setShippingLoading(false);
    }
  };

  // Hitung akumulasi dana selesai
  const completedOrders = orders.filter((o) => o.status_pesanan === 'Selesai');
  const totalDanaDiterima = completedOrders.reduce((sum, o) => sum + Number(o.total_bayar), 0);
  const pendingOrders = orders.filter((o) => ['Dibayar', 'Diproses', 'Dikirim'].includes(o.status_pesanan));
  const totalDanaTertahan = pendingOrders.reduce((sum, o) => sum + Number(o.total_bayar), 0);

  return (
    <div>
      {/* Banner Peringatan Verifikasi Admin (FR-01, FR-02) */}
      {!isVerified && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>⏳</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#92400e' }}>
                Status Akun Penjual: Menunggu Verifikasi
              </h4>
              <p style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                Menurut aturan SRS (UC-01 & FR-02), lapak baru harus disetujui admin sebelum produk dapat tayang.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ background: '#059669', whiteSpace: 'nowrap' }}
            onClick={handleQuickVerify}
          >
            ⚡ Verifikasi Toko Ini Sekarang (Mode Uji)
          </button>
        </div>
      )}

      {/* Profil Lapak Header */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#10b981', fontWeight: '800', letterSpacing: '0.5px' }}>
            🏪 Lapak Penjual Pangan
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            {user?.nama_toko || 'Toko Tani Lokal'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Pemilik: <strong>{user?.name}</strong> • Rekening Pencairan: <strong>{user?.nama_bank || 'BCA'} ({user?.nomor_rekening || '-'})</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', background: '#f8fafc', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TOTAL SALDO DICAIRKAN</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>
              Rp {totalDanaDiterima.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>DANA DITAHAN SISTEM (ESCROW)</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706' }}>
              Rp {totalDanaTertahan.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'products' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Katalog Produk Lapak ({products.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'orders' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📥 Pesanan Masuk ({orders.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'payouts' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          💸 Riwayat Pencairan Dana
        </button>
      </div>

      {/* TAB 1: MANAJEMEN PRODUK (UC-10) */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Kelola stok, harga, dan batas minimum pembelian grosir/eceran (UC-10)
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddProductModal}
            >
              ➕ Tambah / Listing Produk Baru
            </button>
          </div>

          {products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📦</div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Belum ada produk di lapak Anda</h4>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                Mulai pasarkan produk pangan lokal Anda (beras, sayur, cabai, telur, rempah) ke pembeli sekitar.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={openAddProductModal}>
                ➕ Tambah Produk Pertama Sekarang
              </button>
            </div>
          ) : (
            <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Harga Satuan</th>
                    <th>Stok</th>
                    <th>Min. Pembelian</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={p.foto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=80'}
                            alt={p.nama_produk}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <div>
                            <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>{p.nama_produk}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{p.deskripsi ? p.deskripsi.substring(0, 45) + '...' : '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.kategori}</td>
                      <td style={{ fontWeight: '700', color: '#10b981' }}>
                        Rp {Number(p.harga).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <strong style={{ color: p.stok < 10 ? '#dc2626' : '#0f172a' }}>{p.stok}</strong>
                      </td>
                      <td>{p.minimum_pembelian} unit</td>
                      <td>
                        <span className={`status-badge ${p.status_aktif ? 'status-selesai' : 'status-batal'}`}>
                          {p.status_aktif ? 'Aktif Tayang' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditProductModal(p)}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProduct(p.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PESANAN MASUK PENJUAL */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Kelola dan proses alur pesanan yang masuk dari pembeli (Menunggu Pembayaran &rarr; Dibayar &rarr; Diproses &rarr; Dikirim)
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchData}>
              🔄 Refresh Pesanan
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📥</div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Belum ada pesanan masuk</h4>
              <p style={{ color: '#64748b', fontSize: '13px' }}>
                Pesanan dari pembeli akan muncul di sini secara real-time.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Nomor Pesanan: </span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{ord.nomor_pesanan}</strong>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>
                      Pembeli: <strong>{ord.buyer?.name}</strong> ({ord.buyer?.phone || '-'})
                    </span>
                  </div>
                  <div>
                    <span className={`status-badge ${
                      ord.status_pesanan === 'Dibayar' ? 'status-dibayar' :
                      ord.status_pesanan === 'Diproses' ? 'status-diproses' :
                      ord.status_pesanan === 'Dikirim' ? 'status-dikirim' :
                      ord.status_pesanan === 'Selesai' ? 'status-selesai' :
                      ord.status_pesanan === 'Menunggu Pembayaran' ? 'status-menunggu' : 'status-batal'
                    }`}>
                      {ord.status_pesanan}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={ord.product?.foto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=80'}
                    alt={ord.product?.nama_produk}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />

                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                      {ord.product?.nama_produk} ({ord.kuantitas} unit)
                    </h4>
                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Alamat Pengiriman: <strong>{ord.alamat_tujuan}</strong>
                    </div>
                    {ord.kurir && (
                      <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px', fontWeight: '600' }}>
                        🚚 Ekspedisi: {ord.kurir} • No. Resi: <strong>{ord.nomor_resi}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Total Nilai Pesanan:</span>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                        Rp {Number(ord.total_bayar).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* AKSI TOMBOL SESUAI STATE MACHINE SRS */}
                    {ord.status_pesanan === 'Menunggu Pembayaran' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ background: '#0284c7' }}
                          onClick={() => handleProcessOrder(ord.id)}
                          title="Langsung proses pesanan dan catat pembayaran lunas"
                        >
                          ⚡ Mulai Proses Pesanan
                        </button>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          (Pembayaran akan otomatis diverifikasi)
                        </span>
                      </div>
                    )}

                    {ord.status_pesanan === 'Dibayar' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#10b981', fontWeight: '700' }}
                        onClick={() => handleProcessOrder(ord.id)}
                      >
                        ⚡ Mulai Proses Pesanan (Siapkan Pangan)
                      </button>
                    )}

                    {ord.status_pesanan === 'Diproses' && (
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => {
                          setShippingOrder(ord);
                          setNomorResi('RESI-' + Math.floor(100000 + Math.random() * 900000));
                        }}
                      >
                        🚚 Kirim Pesanan (Input Resi & Kurir)
                      </button>
                    )}

                    {ord.status_pesanan === 'Dikirim' && (
                      <span style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: '700', background: '#e0f2fe', padding: '6px 12px', borderRadius: '6px' }}>
                        🚚 Dalam Perjalanan ke Pembeli
                      </span>
                    )}

                    {ord.status_pesanan === 'Selesai' && (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', background: '#dcfce7', padding: '6px 12px', borderRadius: '6px' }}>
                        ✅ Selesai • Dana Rp {Number(ord.total_bayar).toLocaleString('id-ID')} Telah Masuk ke Rekening
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: RIWAYAT PENCAIRAN DANA (PAYOUT) */}
      {activeTab === 'payouts' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>
            💸 Riwayat Pencairan Dana Otomatis ke Rekening Penjual (UC-11)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Setiap kali pembeli mengonfirmasi bahwa produk telah diterima (UC-09), sistem secara otomatis memicu transfer dana penahanan (escrow payout) ke rekening bank Anda.
          </p>

          <table className="data-table">
            <thead>
              <tr>
                <th>Nomor Pesanan</th>
                <th>Bank & No Rekening Tujuan</th>
                <th>Nominal Cair</th>
                <th>Status Pencairan</th>
                <th>Waktu Selesai</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                    Belum ada dana yang dicairkan.
                  </td>
                </tr>
              ) : (
                completedOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td><strong>{ord.nomor_pesanan}</strong></td>
                    <td>{user?.nama_bank || 'BCA'} - {user?.nomor_rekening || '-'}</td>
                    <td style={{ fontWeight: '800', color: '#10b981' }}>
                      Rp {Number(ord.total_bayar).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span className="status-badge status-selesai">TERKIRIM</span>
                    </td>
                    <td>{new Date(ord.updated_at).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Produk (Tambah/Ubah UC-10) */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? '✏️ Ubah Data Produk Pangan' : '➕ Tambah / Listing Produk Pangan Baru'}
              </h3>
              <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>&times;</button>
            </div>

            {/* Template Cepat untuk Pengisian Cepat */}
            {!editingProduct && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  ⚡ Isi Otomatis dengan Template Pangan Cepat:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {quickTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      className="chip-btn"
                      style={{ fontSize: '11.5px', padding: '4px 8px' }}
                      onClick={() => applyTemplate(tpl)}
                    >
                      {tpl.nama_produk.split(' ')[0]} {tpl.nama_produk.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {productError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', border: '1px solid #f87171' }}>
                ⚠️ <strong>Perhatian:</strong> {productError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Nama Produk Pangan</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Contoh: Beras Pandan Wangi Cianjur"
                  value={formData.nama_produk}
                  onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Kategori Pangan</label>
                  <select
                    className="form-control"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  >
                    <option value="Beras & Biji-bijian">Beras & Biji-bijian</option>
                    <option value="Sayuran">Sayuran</option>
                    <option value="Buah-buahan">Buah-buahan</option>
                    <option value="Daging & Telur">Daging & Telur</option>
                    <option value="Bumbu & Rempah">Bumbu & Rempah</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    placeholder="Contoh: 15000"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Jumlah Stok Tersedia</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-control"
                    placeholder="Contoh: 100"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Batas Minimum Pembelian</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    title="Batas beli eceran (1) atau grosir (5/10)"
                    placeholder="1 untuk eceran, 5+ grosir"
                    value={formData.minimum_pembelian}
                    onChange={(e) => setFormData({ ...formData, minimum_pembelian: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">URL Foto Produk (Opsional / Otomatis)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi & Mutu Produk</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Jelaskan kualitas, kesegaran, varietas, atau cara penyimpanan..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                  {savingProduct ? 'Menyimpan...' : 'Simpan & Tayangkan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kirim Pesanan */}
      {shippingOrder && (
        <div className="modal-overlay" onClick={() => setShippingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚚 Kirim Pesanan Pangan</h3>
              <button className="modal-close" onClick={() => setShippingOrder(null)}>&times;</button>
            </div>

            <form onSubmit={handleShipOrder}>
              <div className="form-group">
                <label className="form-label">Pilih Kurir / Armada</label>
                <select className="form-control" value={kurir} onChange={(e) => setKurir(e.target.value)}>
                  <option value="Kurir Tani Mandiri">Kurir Tani Mandiri (Armada Toko)</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="SiCepat">SiCepat</option>
                  <option value="Gosend / GrabExpress">Gosend / GrabExpress Sameday</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Resi / Bukti Pengiriman</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={nomorResi}
                  onChange={(e) => setNomorResi(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimasi Waktu Tiba (Hari)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  className="form-control"
                  value={estimasiHari}
                  onChange={(e) => setEstimasiHari(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShippingOrder(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={shippingLoading}>
                  {shippingLoading ? 'Mengirim...' : 'Konfirmasi Pengiriman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
