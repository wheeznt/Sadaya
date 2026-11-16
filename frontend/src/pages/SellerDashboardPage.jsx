import React, { useState, useEffect } from 'react';
import api from '../api';

export default function SellerDashboardPage({ user }) {
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

  // Modal Kirim Pesanan
  const [shippingOrder, setShippingOrder] = useState(null);
  const [kurir, setKurir] = useState('Kurir Tani Mandiri');
  const [nomorResi, setNomorResi] = useState('');
  const [estimasiHari, setEstimasiHari] = useState('2');

  const isVerified = user?.status_verifikasi === 'Terverifikasi';

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
  }, []);

  const openAddProductModal = () => {
    if (!isVerified) {
      alert('Akun penjual Anda masih berstatus Menunggu Verifikasi. Anda belum dapat menambahkan produk.');
      return;
    }
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

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      nama_produk: prod.nama_produk,
      kategori: prod.kategori,
      harga: prod.harga,
      stok: prod.stok,
      minimum_pembelian: prod.minimum_pembelian,
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

    // Exception Flow UC-10: Cek kelengkapan form
    if (!formData.nama_produk || !formData.harga || formData.stok === '' || !formData.minimum_pembelian) {
      setProductError('Semua kolom wajib diisi lengkap.');
      return;
    }

    try {
      if (editingProduct) {
        await api.put(`/seller/products/${editingProduct.id}`, formData);
        alert('Produk berhasil diperbarui.');
      } else {
        await api.post('/seller/products', formData);
        alert('Produk baru berhasil ditambahkan ke lapak.');
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      setProductError(err.response?.data?.message || 'Gagal menyimpan produk.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini dari lapak?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  // Proses Pesanan ('Dibayar' -> 'Diproses')
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
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{ fontSize: '28px' }}>⏳</div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#92400e' }}>
              Akun Penjual Menunggu Verifikasi Administrator
            </h4>
            <p style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
              Status akun Anda saat ini: <strong>"{user?.status_verifikasi}"</strong>. Sesuai batasan sistem SRS (UC-01 & FR-02), Anda baru dapat mengunggah dan menjual produk setelah admin menyetujui lapak Anda.
            </p>
          </div>
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
            Pemilik: <strong>{user?.name}</strong> • Rekening Pencairan: <strong>{user?.nama_bank} ({user?.nomor_rekening})</strong>
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
              className="btn btn-primary btn-sm"
              onClick={openAddProductModal}
              disabled={!isVerified}
            >
              ➕ Tambah Produk Baru
            </button>
          </div>

          {products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#64748b' }}>Belum ada produk di lapak Anda.</p>
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
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{p.nama_produk}</span>
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
                          {p.status_aktif ? 'Aktif' : 'Nonaktif'}
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
          {orders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#64748b' }}>Belum ada pesanan masuk ke lapak Anda.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Pesanan: </span>
                    <strong style={{ fontSize: '13px' }}>{ord.nomor_pesanan}</strong>
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
                      ord.status_pesanan === 'Selesai' ? 'status-selesai' : 'status-menunggu'
                    }`}>
                      {ord.status_pesanan}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                      {ord.product?.nama_produk} ({ord.kuantitas} unit)
                    </h4>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                      Tujuan Kirim: {ord.alamat_tujuan}
                    </div>
                    {ord.kurir && (
                      <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
                        Kurir: {ord.kurir} • Resi: <strong>{ord.nomor_resi}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
                      Rp {Number(ord.total_bayar).toLocaleString('id-ID')}
                    </div>

                    {/* Tombol alur penjual sesuai Lifecycle SRS */}
                    {ord.status_pesanan === 'Dibayar' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleProcessOrder(ord.id)}
                      >
                        ⚡ Mulai Proses Pesanan
                      </button>
                    )}

                    {ord.status_pesanan === 'Diproses' && (
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => {
                          setShippingOrder(ord);
                          setNomorResi('RESI-' + Math.floor(100000 + Math.random() * 900000));
                        }}
                      >
                        🚚 Kirim Pesanan
                      </button>
                    )}

                    {ord.status_pesanan === 'Dikirim' && (
                      <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>
                        Sedang dalam perjalanan ke pembeli
                      </span>
                    )}

                    {ord.status_pesanan === 'Selesai' && (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700' }}>
                        ✅ Dana Rp {Number(ord.total_bayar).toLocaleString('id-ID')} Sudah Masuk ke Rekening Anda
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
                    <td>{user?.nama_bank} - {user?.nomor_rekening}</td>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? '✏️ Ubah Data Produk Pangan' : '➕ Tambah Produk Pangan Baru'}
              </h3>
              <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>&times;</button>
            </div>

            {productError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                ⚠️ {productError}
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
                  <label className="form-label">Kategori</label>
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
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Jumlah Stok</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-control"
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
                    title="Aturan minimum pembelian eceran atau grosir"
                    value={formData.minimum_pembelian}
                    onChange={(e) => setFormData({ ...formData, minimum_pembelian: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">URL Foto Produk</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Produk</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Produk
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
                <label className="form-label">Pilih Kurir / Ekspedisi</label>
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
                <button type="submit" className="btn btn-primary">
                  Konfirmasi Pengiriman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
