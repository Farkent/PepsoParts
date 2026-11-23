import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { adminGetUsers, adminDeleteUser, adminRestoreUser } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatRupiah } from '../../utils/format';
import Button from '../../components/ui/Button';

export default function UsersPage() {
  const { admin: currentAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'admin'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'deleted'
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, per_page: 15, last_page: 1, stats: { total: 0, active: 0, deleted: 0 } });
  const [loading, setLoading] = useState(true);

  // Modal konfirmasi hapus
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal konfirmasi pulihkan
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminGetUsers({
        type: activeTab,
        q: search,
        status: statusFilter,
        page,
        per_page: 15,
      });

      setUsers(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      showError(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter, showError]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await adminDeleteUser(selectedUser.id, selectedUser.type);
      success(res?.data?.message || res?.message || 'Akun pengguna berhasil dihapus.');
      closeDeleteModal();
      fetchUsers(meta.page);
    } catch (err) {
      showError(err.message || 'Gagal menghapus akun pengguna.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRestoreModal = (user) => {
    setSelectedUser(user);
    setRestoreModalOpen(true);
  };

  const closeRestoreModal = () => {
    setSelectedUser(null);
    setRestoreModalOpen(false);
  };

  const handleRestoreUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await adminRestoreUser(selectedUser.id, selectedUser.type);
      success(res?.data?.message || res?.message || 'Akun pengguna berhasil dipulihkan.');
      closeRestoreModal();
      fetchUsers(meta.page);
    } catch (err) {
      showError(err.message || 'Gagal memulihkan akun pengguna.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-ink tracking-wide">
            Kelola Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Manajemen data akun pelanggan dan administrator serta pengontrolan status aktif.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => fetchUsers(meta.page)}
          loading={loading}
        >
          Muat Ulang
        </Button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-text">
            Total {activeTab === 'customer' ? 'Pelanggan' : 'Administrator'}
          </p>
          <p className="text-2xl font-display font-extrabold text-ink mt-1">
            {meta.stats?.total || 0}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Akun Aktif
          </p>
          <p className="text-2xl font-display font-extrabold text-emerald-600 mt-1">
            {meta.stats?.active || 0}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
            Akun Terhapus (Soft Delete)
          </p>
          <p className="text-2xl font-display font-extrabold text-rose-600 mt-1">
            {meta.stats?.deleted || 0}
          </p>
        </div>
      </div>

      {/* Tab Navigasi & Filter */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('customer');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === 'customer'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-ink'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pelanggan ({activeTab === 'customer' ? meta.stats?.total || 0 : '...'})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admin');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === 'admin'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-ink'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Administrator</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-text font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-neutral-300 rounded-sm text-xs bg-white text-ink focus:border-brand focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="active">Hanya Aktif</option>
              <option value="deleted">Hanya Terhapus</option>
            </select>
          </div>
        </div>

        {/* Kolom Pencarian */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'customer'
                ? 'Cari nama, email, atau nomor WhatsApp pelanggan...'
                : 'Cari nama atau email administrator...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-300 rounded-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* Tabel Data Pengguna */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-text">
            <div className="inline-block animate-spin mb-2">⚙️</div>
            <p>Memuat data pengguna...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-muted-text">
            <UserCheck className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
            <p className="font-bold text-ink">Tidak ada pengguna ditemukan</p>
            <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 font-display uppercase tracking-wider text-muted-text text-[11px]">
                  <th className="py-3 px-4">Pengguna</th>
                  {activeTab === 'customer' ? (
                    <>
                      <th className="py-3 px-4">Kontak WhatsApp</th>
                      <th className="py-3 px-4">Aktivitas Pesanan</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Terakhir Login</th>
                    </>
                  )}
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u) => {
                  const isCurrentAdmin = activeTab === 'admin' && Number(u.id) === Number(currentAdmin?.id);
                  const isSuperAdmin = activeTab === 'admin' && (u.role === 'super_admin' || Number(u.id) === 1);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        u.is_deleted ? 'bg-neutral-50/50 opacity-75' : ''
                      }`}
                    >
                      {/* Kolom Profil Pengguna */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                              activeTab === 'admin'
                                ? 'bg-sidebar text-white border border-sidebar-divider'
                                : 'bg-brand/10 text-brand border border-brand/20'
                            }`}
                          >
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-ink truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 bg-brand-light text-brand text-[9px] font-mono font-bold rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-text flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-neutral-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Khusus Pelanggan */}
                      {activeTab === 'customer' && (
                        <>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-neutral-700">
                              <Phone className="w-3.5 h-3.5 text-green-600" />
                              <span className="font-mono">{u.whatsapp || '-'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold text-ink">
                              <ShoppingBag className="w-3.5 h-3.5 text-brand" />
                              <span>{u.orders_count || 0} pesanan</span>
                            </div>
                            {Number(u.total_spent) > 0 && (
                              <div className="text-[10px] text-muted-text">
                                Total: {formatRupiah(u.total_spent)}
                              </div>
                            )}
                          </td>
                        </>
                      )}

                      {/* Kolom Khusus Admin */}
                      {activeTab === 'admin' && (
                        <>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                                u.role === 'super_admin' || Number(u.id) === 1
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                              }`}
                            >
                              {u.role === 'super_admin' || Number(u.id) === 1 ? 'Super Admin' : 'Admin'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-muted-text">
                            {u.last_login_at ? formatDate(u.last_login_at) : 'Belum pernah'}
                          </td>
                        </>
                      )}

                      {/* Tanggal Terdaftar */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-text">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>{formatDate(u.created_at)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.is_deleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Terhapus ({formatDate(u.deleted_at)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Aktif
                          </span>
                        )}
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {u.is_deleted ? (
                          <button
                            type="button"
                            onClick={() => openRestoreModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            title="Pulihkan Akun"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan</span>
                          </button>
                        ) : isCurrentAdmin ? (
                          <span
                            className="text-[11px] text-neutral-400 italic"
                            title="Gunakan menu pengaturan profil untuk menghapus akun Anda sendiri"
                          >
                            Akun Anda
                          </span>
                        ) : isSuperAdmin ? (
                          <span
                            className="text-[11px] text-amber-600 font-medium"
                            title="Super Admin dilindungi dan tidak dapat dihapus"
                          >
                            Dilindungi
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL KONFIRMASI HAPUS AKUN (ADMIN PANEL) ─── */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full border border-neutral-300 p-6 shadow-2xl rounded-sm">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-display font-bold uppercase text-lg text-ink">
                  Konfirmasi Hapus Akun
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="text-neutral-400 hover:text-ink p-1"
                disabled={actionLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <p className="text-neutral-700">
                Apakah Anda yakin ingin menghapus akun pengguna berikut?
              </p>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm space-y-1">
                <div>
                  <span className="text-muted-text">Nama: </span>
                  <strong className="text-ink">{selectedUser.name}</strong>
                </div>
                <div>
                  <span className="text-muted-text">Email: </span>
                  <strong className="text-ink">{selectedUser.email}</strong>
                </div>
                <div>
                  <span className="text-muted-text">Tipe: </span>
                  <span className="font-bold uppercase font-mono text-[10px] px-1.5 py-0.5 bg-neutral-200 rounded">
                    {selectedUser.type === 'admin' ? 'Administrator' : 'Pelanggan'}
                  </span>
                </div>
              </div>

              {/* Alert Keamanan & Integritas Data */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm space-y-1 text-[11px]">
                <strong className="font-bold block">Peringatan Integritas Data:</strong>
                <p>
                  Tindakan ini adalah <strong>Soft Delete</strong>. Hak akses akun akan dicabut seketika sehingga pengguna tidak dapat masuk kembali.
                </p>
                <p className="text-amber-800">
                  Seluruh data riwayat pesanan dan faktur masa lalu akan <strong>tetap dipertahankan</strong> agar tidak merusak pembukuan penjualan dan laporan keuangan toko.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={closeDeleteModal}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-display font-bold uppercase tracking-wider text-xs rounded-sm transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>{actionLoading ? 'Menghapus...' : 'Ya, Hapus Akun'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL KONFIRMASI PULIHKAN AKUN ─── */}
      {restoreModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full border border-neutral-300 p-6 shadow-2xl rounded-sm">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2 text-emerald-600">
                <RotateCcw className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-display font-bold uppercase text-lg text-ink">
                  Pulihkan Akun Pengguna
                </h3>
              </div>
              <button
                type="button"
                onClick={closeRestoreModal}
                className="text-neutral-400 hover:text-ink p-1"
                disabled={actionLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <p className="text-neutral-700">
                Akun <strong>{selectedUser.name}</strong> ({selectedUser.email}) akan diaktifkan kembali. Pengguna akan dapat masuk kembali menggunakan kata sandi sebelumnya.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={closeRestoreModal}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <button
                type="button"
                onClick={handleRestoreUser}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-display font-bold uppercase tracking-wider text-xs rounded-sm transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading ? 'Memulihkan...' : 'Ya, Pulihkan Akun'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
