import React, { useState } from 'react';

export default function LocationModal({ isOpen, onClose, currentLocation, onUpdateLocation }) {
  const [alamat, setAlamat] = useState(currentLocation.alamat || '');
  const [lat, setLat] = useState(currentLocation.lat || -6.932800);
  const [lng, setLng] = useState(currentLocation.lng || 107.718500);
  const [detecting, setDetecting] = useState(false);

  if (!isOpen) return null;

  // Deteksi lokasi via browser Geolocation API
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAlamat('Lokasi Terdeteksi Otomatis (GPS Aktif)');
        setDetecting(false);
      },
      (err) => {
        alert('Gagal mendeteksi GPS. Silakan masukkan koordinat atau alamat secara manual (Alternative Flow UC-03).');
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  };

  // Preset lokasi sekitar Bandung untuk kemudahan demo pengujian dosen / mahasiswa
  const presets = [
    { name: 'Kampus UPI di Cibiru', lat: -6.932800, lng: 107.718500, alamat: 'Kampus UPI Cibiru, Bandung Timur' },
    { name: 'Pusat Kota Bandung (Alun-alun)', lat: -6.921868, lng: 107.607000, alamat: 'Alun-alun Bandung, Asia Afrika' },
    { name: 'Lembang (Bandung Barat)', lat: -6.816667, lng: 107.616667, alamat: 'Maribaya, Lembang, Bandung Barat' },
    { name: 'Ujung Berung', lat: -6.915000, lng: 107.695000, alamat: 'Ujung Berung, Bandung' },
  ];

  const handleApplyPreset = (p) => {
    setLat(p.lat);
    setLng(p.lng);
    setAlamat(p.alamat);
  };

  const handleSave = () => {
    onUpdateLocation({
      alamat: alamat || 'Lokasi Kustom Pembeli',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📍 Pengaturan Lokasi & GPS Pembeli</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Sesuai <strong>UC-03 (Lihat Produk Terdekat)</strong>, sistem menggunakan lokasi pembeli untuk mengurutkan produk pangan terdekat via Maps Service. Jika GPS tidak aktif, Anda dapat memilih preset atau memasukkan koordinat manual.
        </p>

        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleDetectGPS}
            disabled={detecting}
          >
            {detecting ? '⏳ Mendeteksi...' : '🛰️ Deteksi GPS Perangkat Saya'}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '12px' }}>Pilih Preset Lokasi Simulasi:</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-btn"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                onClick={() => handleApplyPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Alamat / Wilayah</label>
          <input
            type="text"
            className="form-control"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Contoh: Cibiru, Bandung Timur"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Simpan Lokasi</button>
        </div>
      </div>
    </div>
  );
}
