import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'overdue', 'reports', 'payouts'
  const [loading, setLoading] = useState(false);

  // State UC-12: Kelola Data Pengguna
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');

  // State UC-13: Pantau Keterlambatan
  const [overdueOrders, setOverdueOrders] = useState([]);

  // State UC-14: Laporan Transaksi
  const [reportSummary, setReportSummary] = useState(null);
  const [reportOrders, setReportOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportStatus, setReportStatus] = useState('Semua');

  // State Riwayat Payout
  const [payouts, setPayouts] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { role: roleFilter || undefined } });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data pengguna:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/overdue-orders');
      setOverdueOrders(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar keterlambatan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports', {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          status: reportStatus,
        },
      });
      setReportSummary(res.data.summary);
      setReportOrders(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil laporan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payouts');
      setPayouts(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar payout:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'overdue') fetchOverdue();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'payouts') fetchPayouts();
  }, [activeTab, roleFilter]);

  // Aksi Kelola Pengguna (UC-12)
  const handleUserAction = async (userId, action) => {
    const actionNames = {
      verify: 'memverifikasi akun penjual ini',
      reject: 'menolak verifikasi penjual ini',
      block: 'memblokir akun pengguna ini',
      unblock: 'mengaktifkan kembali akun pengguna ini',
      delete: 'MENGHAPUS PERMANEN akun pengguna ini',
    };

    if (!window.confirm(`Apakah Anda yakin ingin ${actionNames[action]}?`)) return;

    try {
      const res = await api.post(`/admin/users/${userId}/action`, { action });
      alert(res.data.message);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses aksi.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
          🛡️ Dashboard Administrator Sistem Sadaya
        </h2>
        <p style={{ fontSize: '13.5px', color: '#64748b' }}>
          Pusat kendali verifikasi pengguna, pemantauan pesanan terlambat, dan rekapitulasi transaksi ekosistem pangan lokal.
        </p>
      </div>

      {/* Tabs Menu Admin */}
      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'users' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Manajemen Pengguna (UC-12)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overdue' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          ⚠️ Pemantauan Keterlambatan (UC-13)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'reports' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Laporan & Rekapitulasi (UC-14)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'payouts' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          💸 Riwayat Payout Penjual
        </button>
      </div>

      {/* TAB 1: MANAJEMEN PENGGUNA (UC-12) */}
      {activeTab === 'users' && (
        <div>
          <div className="card" style={{ marginBottom: '18px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Filter Peran:</span>
              <select
                className="form-control"
                style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Semua Pengguna</option>
                <option value="pembeli">Pembeli</option>
                <option value="penjual">Penjual</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchUsers}>
              🔄 Refresh Data
            </button>
          </div>

          <div className="table-responsive card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Pengguna</th>
                  <th>Email & Telepon</th>
                  <th>Peran</th>
                  <th>Status Akun</th>
                  <th>Status Verifikasi</th>
                  <th>Detail Lapak / Alamat</th>
                  <th>Tindakan (UC-12)</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{u.name}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{u.email}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.phone || '-'}</div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.status_akun === 'Aktif' ? 'status-selesai' : 'status-batal'}`}>
                        {u.status_akun}
                      </span>
                    </td>
                    <td>
                      {u.role === 'penjual' ? (
                        <span className={`status-badge ${
                          u.status_verifikasi === 'Terverifikasi' ? 'status-selesai' :
                          u.status_verifikasi === 'Menunggu' ? 'status-menunggu' : 'status-batal'
                        }`}>
                          {u.status_verifikasi}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                      {u.role === 'penjual' ? (
                        <div>
                          <strong>{u.nama_toko}</strong>
                          <div style={{ color: '#64748b' }}>{u.nama_bank} - {u.nomor_rekening}</div>
                        </div>
                      ) : (
                        <div>{u.alamat || '-'}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {/* Verifikasi Penjual */}
                        {u.role === 'penjual' && u.status_verifikasi === 'Menunggu' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px' }}
                              onClick={() => handleUserAction(u.id, 'verify')}
                              title="Setujui Verifikasi Lapak"
                            >
                              ✓ Setujui
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px', color: '#dc2626' }}
                              onClick={() => handleUserAction(u.id, 'reject')}
                              title="Tolak Verifikasi"
                            >
                              ✕ Tolak
                            </button>
                          </>
                        )}

                        {/* Blokir / Buka Blokir */}
                        {u.role !== 'admin' && (
                          u.status_akun === 'Aktif' ? (
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px' }}
                              onClick={() => handleUserAction(u.id, 'block')}
                              title="Blokir Akun"
                            >
                              Blokir
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px', color: '#16a34a' }}
                              onClick={() => handleUserAction(u.id, 'unblock')}
                              title="Buka Blokir"
                            >
                              Buka Blokir
                            </button>
                          )
                        )}

                        {/* Hapus Akun */}
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            onClick={() => handleUserAction(u.id, 'delete')}
                            title="Hapus Akun Permanen"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PEMANTAUAN KETERLAMBATAN PENGIRIMAN (UC-13) */}
      {activeTab === 'overdue' && (
        <div>
          <div className="card" style={{ marginBottom: '18px', background: '#fffbeb', border: '1px solid #fde68a' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#92400e', marginBottom: '4px' }}>
              ⚠️ Log Pesanan Terlambat (Melebihi Estimasi Waktu Sampai)
            </h4>
            <p style={{ fontSize: '13px', color: '#b45309' }}>
              Sesuai skenario <strong>UC-13</strong> di SRS, sistem mendeteksi transaksi pangan berstatus "Dikirim" yang tanggal estimasi sampai-nya telah lewat dari waktu sekarang. Admin dapat memantau untuk melakukan intervensi atau menghubungi pihak ekspedisi/penjual.
            </p>
          </div>

          {overdueOrders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
              <h4 style={{ fontWeight: '700', color: '#16a34a' }}>Tidak Ada Pesanan Terlambat</h4>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Semua pengiriman pesanan pangan saat ini berjalan tepat waktu.</p>
            </div>
          ) : (
            <div className="table-responsive card" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Pesanan</th>
                    <th>Produk Pangan</th>
                    <th>Pembeli & Penjual</th>
                    <th>Kurir & No. Resi</th>
                    <th>Estimasi Sampai</th>
                    <th>Keterlambatan</th>
                    <th>Total Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueOrders.map((ord) => (
                    <tr key={ord.id} style={{ background: '#fff1f2' }}>
                      <td><strong style={{ color: '#e11d48' }}>{ord.nomor_pesanan}</strong></td>
                      <td><strong>{ord.nama_produk}</strong></td>
                      <td style={{ fontSize: '12px' }}>
                        <div>Pembeli: <strong>{ord.pembeli}</strong></div>
                        <div style={{ color: '#64748b' }}>Penjual: {ord.penjual}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: '600' }}>{ord.kurir}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Resi: {ord.nomor_resi}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(ord.estimasi_sampai).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <span className="status-badge status-batal" style={{ fontSize: '11.5px' }}>
                          Terlambat {ord.terlambat_hari} hari ({ord.terlambat_jam} jam)
                        </span>
                      </td>
                      <td style={{ fontWeight: '800', color: '#10b981' }}>
                        Rp {Number(ord.total_bayar).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LAPORAN & REKAPITULASI TRANSAKSI (UC-14) */}
      {activeTab === 'reports' && (
        <div>
          {/* Form Filter Periode (UC-14) */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#0f172a' }}>
              🔍 Filter Periode & Kategori Laporan Transaksi
            </h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Tanggal Mulai</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Tanggal Akhir</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Status Pesanan</label>
                <select
                  className="form-control"
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibayar">Dibayar (Hold)</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dikirim">Dikirim</option>
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>
              <button type="button" className="btn btn-primary" onClick={fetchReports}>
                Terapkan Filter
              </button>
            </div>
          </div>

          {/* Cards Ringkasan Rekapitulasi */}
          {reportSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="card" style={{ background: '#f8fafc' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>TOTAL TRANSAKSI</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  {reportSummary.total_transaksi} Pesanan
                </div>
              </div>

              <div className="card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                <div style={{ fontSize: '12px', color: '#047857', fontWeight: '600' }}>TOTAL NILAI PERPUTARAN</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#065f46', marginTop: '4px' }}>
                  Rp {Number(reportSummary.total_nominal).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>DANA DITAHAN SISTEM (HOLD)</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', marginTop: '4px' }}>
                  Rp {Number(reportSummary.dana_ditahan).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="card" style={{ background: '#fef3c7', borderColor: '#fde68a' }}>
                <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600' }}>TOTAL DANA DITERUSKAN</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#78350f', marginTop: '4px' }}>
                  Rp {Number(reportSummary.dana_diteruskan).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          )}

          {/* Tabel Log Transaksi Lengkap */}
          <div className="table-responsive card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Tanggal</th>
                  <th>Pembeli</th>
                  <th>Penjual (Lapak)</th>
                  <th>Produk & Qty</th>
                  <th>Metode Bayar</th>
                  <th>Status Pesanan</th>
                  <th>Total Bayar</th>
                </tr>
              </thead>
              <tbody>
                {reportOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td><strong>{ord.nomor_pesanan}</strong></td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(ord.tanggal_pesanan).toLocaleDateString('id-ID')}
                    </td>
                    <td>{ord.buyer?.name}</td>
                    <td>{ord.seller?.nama_toko || ord.seller?.name}</td>
                    <td>{ord.product?.nama_produk} ({ord.kuantitas})</td>
                    <td>{ord.payment?.metode_pembayaran || '-'}</td>
                    <td>
                      <span className={`status-badge ${
                        ord.status_pesanan === 'Selesai' ? 'status-selesai' :
                        ord.status_pesanan === 'Dibayar' ? 'status-dibayar' :
                        ord.status_pesanan === 'Dikirim' ? 'status-dikirim' :
                        ord.status_pesanan === 'Diproses' ? 'status-diproses' :
                        ord.status_pesanan === 'Dibatalkan' ? 'status-batal' : 'status-menunggu'
                      }`}>
                        {ord.status_pesanan}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', color: '#10b981' }}>
                      Rp {Number(ord.total_bayar).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT PAYOUT */}
      {activeTab === 'payouts' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>
            💸 Riwayat Pencairan Dana ke Penjual (Escrow Payout Log)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Log otomatis ketika pembeli mengonfirmasi pesanan diterima (UC-09, UC-11).
          </p>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID Payout</th>
                <th>Toko Penjual</th>
                <th>Rekening Tujuan</th>
                <th>Nominal Transfer</th>
                <th>Status</th>
                <th>Waktu Pencairan</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td><strong>PAYOUT-{p.id}</strong></td>
                  <td>{p.seller?.nama_toko || p.seller?.name}</td>
                  <td>{p.nama_bank} - {p.nomor_rekening}</td>
                  <td style={{ fontWeight: '800', color: '#10b981' }}>
                    Rp {Number(p.nominal).toLocaleString('id-ID')}
                  </td>
                  <td><span className="status-badge status-selesai">{p.status_pencairan}</span></td>
                  <td style={{ fontSize: '12px' }}>{new Date(p.tanggal_pencairan).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
