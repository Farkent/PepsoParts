import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  LogOut,
  Mail,
  PackageCheck,
  Phone,
  UserRound,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  ShieldAlert,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { customerGetOrders, customerDeleteAccount } from '../../api/endpoints';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatRupiah } from '../../utils/format';

const orderStatus = {
  new: 'Dibuat',
  confirmed: 'Dikonfirmasi',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function CustomerAccountPage() {
  const navigate = useNavigate();
  const { customer, loading, logout } = useCustomerAuth();
  const { error: showError, success } = useToast();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // State untuk Modal Hapus Akun (Danger Zone)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!customer) return;
    let active = true;
    setOrdersLoading(true);
    customerGetOrders()
      .then((res) => {
        if (active) setOrders(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (active) showError(err.message || 'Riwayat pesanan gagal dimuat.');
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => { active = false; };
  }, [customer, showError]);

  const handleLogout = async () => {
    try {
      await logout();
      success('Anda berhasil keluar.');
      setOrders([]);
    } catch (err) {
      showError(err.message || 'Tidak dapat keluar dari akun.');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (confirmText !== 'HAPUS AKUN') {
      setDeleteError('Teks konfirmasi harus persis "HAPUS AKUN".');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await customerDeleteAccount({
        password,
        confirmation: confirmText,
      });
      success(res?.data?.message || res?.message || 'Akun Anda berhasil dihapus.');
      setDeleteModalOpen(false);
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus akun. Periksa kata sandi Anda.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-text">Memuat akun...</div>;
  }

  if (customer) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Dashboard Pelanggan</p>
            <h1 className="font-display text-3xl font-extrabold uppercase text-ink mt-1">
              Halo, {customer.name}
            </h1>
            <p className="text-sm text-muted-text mt-1">Kelola akun dan pantau pesanan Anda.</p>
          </div>
          <Button variant="outline" icon={LogOut} onClick={handleLogout}>Keluar</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-neutral-200 p-5 rounded-sm h-fit space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold uppercase border-b border-neutral-200 pb-3 mb-4">Profil Akun</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <UserRound className="w-4 h-4 text-brand mt-0.5" />
                  <div><p className="text-xs text-muted-text">Nama</p><p className="font-semibold">{customer.name}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-brand mt-0.5" />
                  <div><p className="text-xs text-muted-text">Email</p><p className="font-semibold break-all">{customer.email}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-brand mt-0.5" />
                  <div><p className="text-xs text-muted-text">WhatsApp</p><p className="font-semibold">{customer.whatsapp}</p></div>
                </div>
              </div>
            </div>

            {/* Zona Bahaya / Danger Zone */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="p-3.5 border border-rose-200 bg-rose-50/70 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-display font-bold uppercase text-xs tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Zona Bahaya</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Menghapus akun Anda akan menonaktifkan akun secara permanen. Anda tidak dapat masuk kembali.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPassword('');
                    setConfirmText('');
                    setDeleteError('');
                    setDeleteModalOpen(true);
                  }}
                  className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-display font-bold uppercase tracking-wider text-xs rounded-sm transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Akun Saya</span>
                </button>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white border border-neutral-200 p-5 rounded-sm">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3 mb-2">
              <h2 className="font-display text-lg font-bold uppercase">Riwayat Pesanan</h2>
              <PackageCheck className="w-5 h-5 text-brand" />
            </div>
            {ordersLoading ? (
              <p className="py-8 text-center text-sm text-muted-text">Memuat riwayat pesanan...</p>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-text mb-4">Belum ada pesanan dari akun ini.</p>
                <Link to="/">
                  <Button variant="primary" icon={ArrowRight}>Jelajahi Katalog</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <div key={order.code} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{order.code}</p>
                      <p className="text-xs text-muted-text mt-1">
                        {formatDate(order.created_at)} · {order.items_count} barang
                      </p>
                      {order.courier && order.tracking_number && (
                        <p className="text-xs text-muted-text mt-1">
                          {order.courier} · Resi: <span className="font-mono">{order.tracking_number}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <p className="font-display font-bold text-brand">{formatRupiah(order.total_amount)}</p>
                      <p className="text-xs text-muted-text mt-1">{orderStatus[order.status] || order.status}</p>
                      {order.public_token && (
                        <Link
                          to={`/pesanan/${encodeURIComponent(order.code)}?token=${encodeURIComponent(order.public_token)}`}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          Lacak Pesanan
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─── MODAL KONFIRMASI KETAT HAPUS AKUN SENDIRI ─── */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full border border-neutral-300 p-6 shadow-2xl rounded-sm">
              <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-display font-bold uppercase text-lg text-ink">
                    Hapus Akun Permanen
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="text-neutral-400 hover:text-ink p-1"
                  disabled={deleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDeleteAccount} className="mt-4 space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-sm text-xs leading-relaxed space-y-1">
                  <strong className="block font-bold">Peringatan Penting:</strong>
                  <p>
                    Tindakan ini <strong>permanen dan tidak dapat dibatalkan</strong>. Sesi Anda akan langsung diakhiri dan akun Anda dinonaktifkan.
                  </p>
                  <p className="text-[11px] text-rose-800">
                    Riwayat pesanan yang sudah tercatat tetap disimpan di sistem pembukuan toko untuk keperluan faktur transaksi.
                  </p>
                </div>

                {deleteError && (
                  <div className="p-2.5 bg-red-100 border border-red-300 text-red-800 text-xs rounded-sm">
                    {deleteError}
                  </div>
                )}

                {/* Input Password Saat Ini */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                    1. Masukkan Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kata sandi akun Anda"
                      required
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-sm focus:border-rose-600 focus:outline-none pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Input Konfirmasi Teks */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                    2. Ketik <span className="text-rose-600 font-mono">HAPUS AKUN</span> untuk konfirmasi
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Ketik HAPUS AKUN"
                    required
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-sm focus:border-rose-600 focus:outline-none font-mono tracking-wider"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={deleting}
                  >
                    Batalkan
                  </Button>
                  <button
                    type="submit"
                    disabled={!password || confirmText !== 'HAPUS AKUN' || deleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-display font-bold uppercase tracking-wider text-xs rounded-sm transition-colors shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleting ? 'Memproses...' : 'Hapus Akun Saya Sekarang'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Jika belum login → redirect ke halaman login terpadu
  return <Navigate to="/login" replace />;
}