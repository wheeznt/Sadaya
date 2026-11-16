import React, { useState, useEffect } from 'react';
import api from '../api';

export default function BuyerOrdersPage({ onOpenPayment }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [confirmModalOrder, setConfirmModalOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/buyer/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil pesanan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      alert(res.data.message);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan pesanan.');
    }
  };

  // UC-09: Konfirmasi Pesanan Diterima & Memicu UC-11 (Teruskan Dana)
  const handleConfirmReceived = async () => {
    if (!confirmModalOrder) return;
    setConfirming(true);
    try {
      const res = await api.post(`/orders/${confirmModalOrder.id}/confirm-received`);
      alert(res.data.message);
      setConfirmModalOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal konfirmasi pesanan.');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return <span className="status-badge status-menunggu">⏳ Menunggu Pembayaran</span>;
      case 'Dibayar':
        return <span className="status-badge status-dibayar">💳 Dibayar (Dana Ditahan)</span>;
      case 'Diproses':
        return <span className="status-badge status-diproses">📦 Sedang Diproses Penjual</span>;
      case 'Dikirim':
        return <span className="status-badge status-dikirim">🚚 Dalam Pengiriman</span>;
      case 'Selesai':
        return <span className="status-badge status-selesai">✅ Selesai (Dana Diteruskan)</span>;
      case 'Dibatalkan':
        return <span className="status-badge status-batal">❌ Dibatalkan</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const filteredOrders = filterStatus === 'Semua'
    ? orders
    : orders.filter((o) => o.status_pesanan === filterStatus);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>🛍️ Riwayat Pesanan Saya</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Pantau status pesanan bahan pangan Anda dan konfirmasi penerimaan barang untuk melepaskan dana ke penjual.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchOrders}>
          🔄 Segarkan Data
        </button>
      </div>

      {/* Tabs Filter Status */}
      <div className="tabs-header">
        {['Semua', 'Menunggu Pembayaran', 'Dibayar', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'].map((st) => (
          <button
            key={st}
            type="button"
            className={`tab-btn ${filterStatus === st ? 'active-tab' : ''}`}
            onClick={() => setFilterStatus(st)}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          ⏳ Memuat daftar pesanan...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Belum ada pesanan dengan status "{filterStatus}".</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const isHold = ['Dibayar', 'Diproses', 'Dikirim'].includes(order.status_pesanan);

            return (
              <div key={order.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                      Nomor Pesanan: <strong style={{ color: '#0f172a' }}>{order.nomor_pesanan}</strong>
                      <span style={{ margin: '0 8px' }}>•</span>
                      {new Date(order.tanggal_pesanan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                      🏪 Penjual: {order.seller?.nama_toko || order.seller?.name}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status_pesanan)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={order.product?.foto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'}
                    alt={order.product?.nama_produk}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      {order.product?.nama_produk}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {order.kuantitas} unit &times; Rp {Number(order.harga_satuan).toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                      📍 Alamat Tujuan: {order.alamat_tujuan}
                    </div>
                    {order.kurir && (
                      <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '2px', fontWeight: '600' }}>
                        🚚 Ekspedisi: {order.kurir} (No. Resi: {order.nomor_resi})
                        {order.estimasi_sampai && (
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>
                            • Estimasi Sampai: {new Date(order.estimasi_sampai).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Total Tagihan</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginBottom: '10px' }}>
                      Rp {Number(order.total_bayar).toLocaleString('id-ID')}
                    </div>

                    {/* Tombol aksi sesuai state */}
                    {order.status_pesanan === 'Menunggu Pembayaran' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Batalkan
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onOpenPayment(order)}
                        >
                          Bayar Sekarang
                        </button>
                      </div>
                    )}

                    {order.status_pesanan === 'Dikirim' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ background: '#059669' }}
                        onClick={() => setConfirmModalOrder(order)}
                      >
                        📦 Konfirmasi Pesanan Diterima
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner Status Escrow */}
                {isHold && (
                  <div style={{ marginTop: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛡️</span>
                    <span>
                      <strong>Status Dana: DITAHAN SISTEM (HOLD).</strong> Dana Anda aman tersimpan dan baru akan diteruskan ke penjual setelah Anda mengonfirmasi pesanan telah sampai dan sesuai.
                    </span>
                  </div>
                )}

                {order.status_pesanan === 'Selesai' && order.payout_record && (
                  <div style={{ marginTop: '14px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💸</span>
                    <span>
                      <strong>Transaksi Tuntas:</strong> Dana sebesar Rp {Number(order.payout_record.nominal).toLocaleString('id-ID')} telah sukses dicairkan ke rekening penjual ({order.payout_record.nama_bank} - {order.payout_record.nomor_rekening}).
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Konfirmasi Pesanan Diterima (UC-09 & UC-11) */}
      {confirmModalOrder && (
        <div className="modal-overlay" onClick={() => setConfirmModalOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📦 Konfirmasi Penerimaan Pesanan (UC-09)</h3>
              <button className="modal-close" onClick={() => setConfirmModalOrder(null)}>&times;</button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#334155', marginBottom: '14px', lineHeight: '1.5' }}>
              Apakah bahan pangan <strong>"{confirmModalOrder.product?.nama_produk}"</strong> sebanyak <strong>{confirmModalOrder.kuantitas} unit</strong> telah Anda terima dalam kondisi segar dan sesuai?
            </p>

            <div className="escrow-banner">
              <div className="escrow-icon">💰</div>
              <div className="escrow-text">
                <h4>Pencairan Dana Penjualan (UC-11)</h4>
                <p>
                  Dengan menekan konfirmasi ini, status pesanan akan diselesaikan dan sistem akan secara otomatis meneruskan dana sebesar <strong>Rp {Number(confirmModalOrder.total_bayar).toLocaleString('id-ID')}</strong> ke rekening penjual ({confirmModalOrder.seller?.nama_toko || confirmModalOrder.seller?.name}).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModalOrder(null)}
                disabled={confirming}
              >
                Belum Sesuai / Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReceived}
                disabled={confirming}
              >
                {confirming ? 'Mencairkan Dana...' : 'Ya, Pesanan Telah Diterima Sesuai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
