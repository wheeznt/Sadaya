import React, { useState } from 'react';
import api from '../api';

export default function PaymentModal({ order, isOpen, onClose, onPaymentSuccess }) {
  if (!isOpen || !order) return null;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const payment = order.payment;
  const total = Number(order.total_bayar) || 0;

  // Skenario Utama: Bayar Berhasil (UC-08)
  const handlePaySuccess = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/orders/${order.id}/pay`);
      alert('Pembayaran berhasil dikonfirmasi! Status pesanan kini "Dibayar". Dana aman ditahan oleh sistem Sadaya.');
      onPaymentSuccess(res.data.data.order);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memproses pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  // Exception Flow: Simulasi Gagal / Kedaluwarsa
  const handleSimulateFail = async () => {
    if (!window.confirm('Simulasikan pembayaran gagal / kedaluwarsa? Pesanan akan dibatalkan otomatis dan stok dikembalikan.')) {
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/orders/${order.id}/simulate-fail`);
      alert(res.data.message);
      onPaymentSuccess(res.data.data);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal simulasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">💳 Simulasi Payment Gateway (UC-08)</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Nomor Pesanan:</span>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{order.nomor_pesanan}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Produk:</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{order.product?.nama_produk} ({order.kuantitas} unit)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Metode Pembayaran:</span>
            <strong style={{ fontSize: '13px', color: '#0369a1' }}>{payment?.metode_pembayaran || 'Transfer Bank'}</strong>
          </div>
          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Total Tagihan:</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1e40af', marginBottom: '16px' }}>
          <strong>Instruksi Pembayaran:</strong>
          <p style={{ marginTop: '4px' }}>
            {payment?.instruksi_pembayaran || `Silakan transfer ke nomor VA: 88019${order.id}1284`}
          </p>
        </div>

        <div className="escrow-banner">
          <div className="escrow-icon">🔒</div>
          <div className="escrow-text">
            <h4>Mekanisme Penahanan Dana (Escrow)</h4>
            <p>
              Saat Anda menekan <strong>Bayar Sekarang</strong>, Payment Gateway akan mengonfirmasi transaksi sukses. Dana Anda tidak langsung masuk ke rekening penjual, melainkan <strong>ditahan (HOLD)</strong> oleh sistem hingga Anda mengonfirmasi penerimaan barang.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handlePaySuccess}
            disabled={loading}
          >
            {loading ? 'Menghubungkan ke Gateway...' : '✅ Bayar Sekarang (Simulasi Berhasil)'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={handleSimulateFail}
            disabled={loading}
          >
            ❌ Simulasi Pembayaran Gagal / Kedaluwarsa (Exception Flow)
          </button>
        </div>
      </div>
    </div>
  );
}
