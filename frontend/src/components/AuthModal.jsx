import React, { useState } from 'react';
import api from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, defaultTab = 'login' }) {
  const [isLoginTab, setIsLoginTab] = useState(defaultTab === 'login');
  const [role, setRole] = useState('pembeli');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [alamat, setAlamat] = useState('');
  // Seller specific
  const [namaToko, setNamaToko] = useState('');
  const [alamatToko, setAlamatToko] = useState('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [namaBank, setNamaBank] = useState('BCA');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('sadaya_token', res.data.token);
      localStorage.setItem('sadaya_user', JSON.stringify(res.data.user));
      onAuthSuccess(res.data.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal login. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role,
        alamat,
        ...(role === 'penjual' ? {
          nama_toko: namaToko,
          alamat_toko: alamatToko,
          nomor_rekening: nomorRekening,
          nama_bank: namaBank,
        } : {})
      };

      const res = await api.post('/register', payload);
      localStorage.setItem('sadaya_token', res.data.token);
      localStorage.setItem('sadaya_user', JSON.stringify(res.data.user));
      
      setSuccessMsg(res.data.message);
      setTimeout(() => {
        onAuthSuccess(res.data.user);
        onClose();
      }, 1000);
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0][0];
        setErrorMsg(firstErr);
      } else {
        setErrorMsg(err.response?.data?.message || 'Gagal registrasi. Cek kelengkapan data.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isLoginTab ? '🔐 Masuk ke Akun Anda' : '📝 Registrasi Akun Baru'}
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="tabs-header" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={`tab-btn ${isLoginTab ? 'active-tab' : ''}`}
            onClick={() => { setIsLoginTab(true); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            className={`tab-btn ${!isLoginTab ? 'active-tab' : ''}`}
            onClick={() => { setIsLoginTab(false); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Daftar Akun Baru
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
            ✅ {successMsg}
          </div>
        )}

        {isLoginTab ? (
          /* FORM LOGIN */
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Pengguna</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Sedang Memeriksa...' : 'Masuk Sekarang'}
            </button>
          </form>
        ) : (
          /* FORM REGISTER */
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Pilih Peran Akun (SRS UC-01):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${role === 'pembeli' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '13px', padding: '8px' }}
                  onClick={() => setRole('pembeli')}
                >
                  🛒 Pembeli Pangan
                </button>
                <button
                  type="button"
                  className={`btn ${role === 'penjual' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '13px', padding: '8px' }}
                  onClick={() => setRole('penjual')}
                >
                  🌾 Penjual / Petani
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / HP</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Lengkap</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Alamat rumah / domisili"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
              ></textarea>
            </div>

            {role === 'penjual' && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#0f172a', marginBottom: '10px', fontWeight: '700' }}>
                  🏪 Informasi Toko Pangan & Rekening Pencairan
                </h4>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px' }}>
                  Catatan: Akun penjual baru akan berstatus <em>"Menunggu Verifikasi Admin"</em> sebelum dapat menambahkan produk (Aturan SRS).
                </p>

                <div className="form-group">
                  <label className="form-label">Nama Lapak / Toko Tani</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Contoh: Toko Tani Sejahtera Cibiru"
                    value={namaToko}
                    onChange={(e) => setNamaToko(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Lapak / Kebun</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Alamat fisik lapak"
                    value={alamatToko}
                    onChange={(e) => setAlamatToko(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Nama Bank</label>
                    <select
                      className="form-control"
                      value={namaBank}
                      onChange={(e) => setNamaBank(e.target.value)}
                    >
                      <option value="BCA">BCA</option>
                      <option value="Bank Mandiri">Bank Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor Rekening</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="Nomor rekening"
                      value={nomorRekening}
                      onChange={(e) => setNomorRekening(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Sekarang'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
