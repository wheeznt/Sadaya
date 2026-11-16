import React, { useState } from 'react';
import api from '../api';

export default function ProductDetailModal({ product, isOpen, onClose, user, onOrderSuccess, onOpenAuth }) {
  if (!isOpen || !product) return null;

  const [qty, setQty] = useState(product.minimum_pembelian || 1);
  const [alamatTujuan, setAlamatTujuan] = useState(user?.alamat || 'Kampus UPI di Cibiru, Jl. Raya Cibiru No. 15, Bandung');
  const [metodePembayaran, setMetodePembayaran] = useState('Transfer Bank BCA');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const minBeli = product.minimum_pembelian || 1;
  const stok = product.stok || 0;
  const harga = Number(product.harga) || 0;
  const total = qty * harga;

  // Validasi interaktif (UC-07)
  const isTooLow = qty < minBeli;
  const isTooHigh = qty > stok;
  const isValid = !isTooLow && !isTooHigh && qty > 0;

  const handleQtyChange = (val) => {
    const num = parseInt(val, 10);
    setQty(isNaN(num) ? 0 : num);
    setErrorMsg('');
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      alert('Silakan login terlebih dahulu untuk membuat pesanan.');
      onOpenAuth();
      return;
    }

    if (user.role !== 'pembeli') {
      setErrorMsg('Hanya akun Pembeli yang dapat melakukan pemesanan.');
      return;
    }

    // Exception UC-07: Validasi Stok & Minimum Pembelian
    if (qty < minBeli) {
      setErrorMsg(`Jumlah pesanan (${qty}) kurang dari batas minimum pembelian penjual (${minBeli}).`);
      return;
    }

    if (qty > stok) {
      setErrorMsg(`Jumlah pesanan (${qty}) melebihi stok yang tersedia (${stok}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/orders', {
        produk_id: product.id,
        kuantitas: qty,
        alamat_tujuan: alamatTujuan,
        metode_pembayaran: metodePembayaran,
      });

      onOrderSuccess(res.data.data.order);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal membuat pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📦 Detail & Pemesanan Produk Pangan</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', marginBottom: '16px' }}>
          <img
            src={product.foto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'}
            alt={product.nama_produk}
            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
            }}
          />
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{product.nama_produk}</h4>
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
              Rp {harga.toLocaleString('id-ID')} / satuan
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              🏪 Toko: <strong>{product.seller?.nama_toko || product.seller?.name}</strong>
            </div>
            {product.jarak_km !== null && (
              <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '2px', fontWeight: '600' }}>
                📍 Jarak dari Anda: {product.jarak_km} km
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
              {product.seller?.alamat_toko}
            </div>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#334155', marginBottom: '16px' }}>
          <strong>Deskripsi:</strong> {product.deskripsi || 'Bahan pangan berkualitas langsung dari kelompok tani.'}
        </div>

        <div className="escrow-banner">
          <div className="escrow-icon">🛡️</div>
          <div className="escrow-text">
            <h4>Jaminan Transaksi Aman (Sistem Escrow / Dana Ditahan)</h4>
            <p>
              Sesuai aturan <strong>FR-06</strong> dan <strong>FR-08</strong>, dana pembayaran akan ditahan oleh sistem Sadaya dan hanya akan diteruskan ke penjual setelah Anda mengonfirmasi pesanan telah diterima dengan baik.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
            ⚠️ <strong>Validasi Gagal:</strong> {errorMsg}
          </div>
        )}

        {/* Form Pesan Produk (UC-06, UC-07) */}
        <form onSubmit={handleOrder}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>
              Atur Kuantitas & Validasi Pembelian
            </h5>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">Jumlah Pembelian</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleQtyChange(Math.max(1, qty - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ textAlign: 'center', fontWeight: '700' }}
                    value={qty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleQtyChange(qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Ketentuan Penjual</label>
                <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#475569' }}>
                  <div>• Batas Minimum: <strong>{minBeli} satuan</strong></div>
                  <div>• Sisa Stok Tersedia: <strong>{stok} satuan</strong></div>
                </div>
              </div>
            </div>

            {/* Error badge spesifik UC-07 */}
            {isTooLow && (
              <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>
                ❌ Jumlah kurang dari batas minimum pembelian ({minBeli}).
              </div>
            )}
            {isTooHigh && (
              <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>
                ❌ Jumlah melebihi stok yang tersedia ({stok}).
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Kalkulasi Total Bayar:</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Metode Pembayaran (Payment Gateway)</label>
            <select
              className="form-control"
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
            >
              <option value="Transfer Bank BCA">Transfer Bank BCA</option>
              <option value="Mandiri Virtual Account">Mandiri Virtual Account</option>
              <option value="BRI Virtual Account">BRI Virtual Account</option>
              <option value="QRIS">QRIS (Gopay / OVO / ShopeePay / Dana)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Pengiriman</label>
            <textarea
              className="form-control"
              rows="2"
              required
              value={alamatTujuan}
              onChange={(e) => setAlamatTujuan(e.target.value)}
              placeholder="Alamat lengkap penerima pesanan"
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isValid}
            >
              {loading ? 'Memproses Pesanan...' : 'Konfirmasi & Lanjut Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
