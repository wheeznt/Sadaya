import React, { useState } from 'react';
import api from '../api';

export default function ProfilePage({ user, onUserUpdated }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [alamat, setAlamat] = useState(user?.alamat || '');
  const [latitude, setLatitude] = useState(user?.latitude || '');
  const [longitude, setLongitude] = useState(user?.longitude || '');
  const [catatanAlamat, setCatatanAlamat] = useState(user?.catatan_alamat || '');
  // Penjual
  const [namaToko, setNamaToko] = useState(user?.nama_toko || '');
  const [alamatToko, setAlamatToko] = useState(user?.alamat_toko || '');
  const [nomorRekening, setNomorRekening] = useState(user?.nomor_rekening || '');
  const [namaBank, setNamaBank] = useState(user?.nama_bank || 'BCA');
  // Password
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const payload = {
        name,
        email,
        phone,
        alamat,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        catatan_alamat: catatanAlamat,
        ...(user?.role === 'penjual' ? {
          nama_toko: namaToko,
          alamat_toko: alamatToko,
          nomor_rekening: nomorRekening,
          nama_bank: namaBank,
        } : {}),
        ...(password ? { password } : {})
      };

      const res = await api.put('/user/profile', payload);
      setMsg({ type: 'success', text: res.data.message });
      localStorage.setItem('sadaya_user', JSON.stringify(res.data.user));
      onUserUpdated(res.data.user);
      setPassword('');
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Gagal memperbarui profil akun.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          👤 Kelola Akun & Profil Pribadi (UC-15)
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          Atur informasi kontak, alamat koordinat peta, nomor rekening, dan kata sandi akun Anda.
        </p>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#ecfdf5' : '#fee2e2',
            border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#f87171'}`,
            color: msg.type === 'success' ? '#065f46' : '#991b1b',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '18px',
          }}>
            {msg.type === 'success' ? '✅ ' : '⚠️ '} {msg.text}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Peran Akun</label>
            <input
              type="text"
              disabled
              className="form-control"
              style={{ background: '#f1f5f9', fontWeight: '700' }}
              value={user?.role?.toUpperCase()}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                required
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Akun (Login)</label>
              <input
                type="email"
                required
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nomor Telepon / WhatsApp</label>
            <input
              type="text"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Lengkap</label>
            <textarea
              className="form-control"
              rows="2"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Latitude Lokasi</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude Lokasi</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          {user?.role === 'penjual' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
                🏪 Pengaturan Lapak & Rekening Pencairan Penjual (UC-11)
              </h4>

              <div className="form-group">
                <label className="form-label">Nama Toko / Lapak</label>
                <input
                  type="text"
                  className="form-control"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Lapak / Kebun</label>
                <input
                  type="text"
                  className="form-control"
                  value={alamatToko}
                  onChange={(e) => setAlamatToko(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Bank</label>
                  <select className="form-control" value={namaBank} onChange={(e) => setNamaBank(e.target.value)}>
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
                    className="form-control"
                    value={nomorRekening}
                    onChange={(e) => setNomorRekening(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Ganti Kata Sandi (Kosongkan jika tidak diubah)</label>
            <input
              type="password"
              className="form-control"
              placeholder="Masukkan password baru minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Akun'}
          </button>
        </form>
      </div>
    </div>
  );
}
