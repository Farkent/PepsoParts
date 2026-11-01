import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle2, ShoppingBag, Bell, Plus, Search, ArrowRight, Eye, Edit } from 'lucide-react';
import { adminGetDashboard } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { formatRupiah, formatDate } from '../../utils/format';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    adminGetDashboard()
      .then((res) => {
        setData(res?.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 w-48 rounded-sm"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-200 rounded-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  const cards = data?.cards || {};
  const recentProducts = (data?.recent_products || []).filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });
  const recentOrders = data?.recent_orders || [];

  const statItems = [
    {
      title: 'Total Produk',
      value: cards.total_products?.value ?? 0,
      note: cards.total_products?.note ?? 'Total katalog',
      icon: Package,
      color: 'text-brand',
    },
    {
      title: 'Produk Tersedia',
      value: cards.available_products?.value ?? 0,
      note: cards.available_products?.note ?? 'Stok siap kirim',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      title: 'Produk Terjual',
      value: cards.sold_products?.value ?? 0,
      note: cards.sold_products?.note ?? 'Terjual',
      icon: ShoppingBag,
      color: 'text-neutral-600',
    },
    {
      title: 'Pesanan Baru',
      value: cards.new_orders?.value ?? 0,
      note: cards.new_orders?.note ?? 'Menunggu konfirmasi',
      icon: Bell,
      color: 'text-brand-dark',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
            RINGKASAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
            Dashboard Pemilik
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/produk/tambah">
            <Button variant="primary" icon={Plus}>
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-text">
                  {item.title}
                </span>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <div className="text-3xl font-display font-extrabold text-ink">{item.value}</div>
                <div className="text-xs text-muted-text mt-1">{item.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Produk Terbaru (Kiri) & Pesanan Baru (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Produk Terbaru (2 Kolom di Desktop) */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-sm p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h2 className="font-display font-bold uppercase text-lg text-ink">Produk Terbaru</h2>
              <p className="text-xs text-muted-text">Katalog yang baru ditambahkan ke toko</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-sm focus:outline-none focus:border-brand"
                />
              </div>
              <Link to="/admin/produk">
                <Button variant="ghost" size="sm">
                  Semua Produk ›
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Table / Mobile Card */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted-table uppercase tracking-wider font-display font-bold text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-3">Tipe Motor</th>
                  <th className="py-2.5 px-3">Harga</th>
                  <th className="py-2.5 px-3 text-center">Stok</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-muted-text">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.primary_thumb || p.primary_image || '/uploads/sample_mesin_1.svg'}
                            alt={p.name}
                            className="w-9 h-9 object-cover rounded-xs border border-neutral-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-ink truncate max-w-[200px]">{p.name}</div>
                            <div className="text-[11px] font-display font-bold text-brand uppercase">{p.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-muted-text truncate max-w-[140px]">
                        {p.motor_types_text || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink whitespace-nowrap">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {p.stock}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={p.status} stock={p.stock} />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        <Link
                          to={`/produk/${p.slug}`}
                          target="_blank"
                          title="Lihat di katalog"
                          className="p-1 inline-block text-neutral-400 hover:text-brand"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/produk/edit/${p.id}`}
                          title="Edit produk"
                          className="p-1 inline-block text-neutral-400 hover:text-ink"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Pesanan Terkini (1 Kolom di Desktop) */}
        <div className="bg-white border border-neutral-200 rounded-sm p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="font-display font-bold uppercase text-lg text-ink">Pesanan Terkini</h2>
              <p className="text-xs text-muted-text">Aktivitas pesanan dari website</p>
            </div>
            <Link to="/admin/pesanan" className="text-xs font-bold text-brand hover:underline">
              Kelola
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-text">
                <Bell className="w-6 h-6 text-neutral-300 mx-auto mb-2" />
                Belum ada pesanan masuk.
              </div>
            ) : (
              recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 border border-neutral-100 rounded-sm bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="font-display text-brand">{ord.code}</span>
                    <span className="text-neutral-500">{formatDate(ord.created_at, false)}</span>
                  </div>
                  <div className="text-xs font-semibold text-ink mt-1">{ord.customer_name}</div>
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-neutral-100">
                    <span className="text-muted-text">{formatRupiah(ord.total_amount)}</span>
                    <Badge variant={ord.status === 'new' ? 'brand' : 'default'} size="sm">
                      {ord.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
