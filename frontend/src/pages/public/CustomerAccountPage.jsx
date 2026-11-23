import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, LogOut, Mail, PackageCheck, Phone, UserRound } from 'lucide-react';
import Button from '../../components/ui/Button';
import { customerGetOrders } from '../../api/endpoints';
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
  const { customer, loading, logout } = useCustomerAuth();
  const { error: showError, success } = useToast();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
          <section className="bg-white border border-neutral-200 p-5 rounded-sm h-fit">
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
      </div>
    );
  }

  // Jika belum login → redirect ke halaman login terpadu
  return <Navigate to="/login" replace />;
}