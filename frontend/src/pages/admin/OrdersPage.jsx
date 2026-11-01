import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Filter, Calendar, RefreshCw } from 'lucide-react';
import { adminGetOrders } from '../../api/endpoints';
import { formatRupiah, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        offset: (page - 1) * limit,
      };
      if (status) params.status = status;
      if (search.trim()) params.q = search.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await adminGetOrders(params);
      if (res.data && res.data.success) {
        setOrders(res.data.data);
        setTotal(res.data.meta?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setStatus('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-ink">
            Kelola Pesanan
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            Daftar pesanan masuk dari pelanggan dan status pengirimannya
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchOrders}>
          Segarkan
        </Button>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white border border-neutral-200 rounded-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <div>
          <Input
            placeholder="Cari kode / nama / WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs h-9 px-3 border border-neutral-300 rounded-sm bg-white text-ink focus:outline-none focus:border-brand"
          >
            <option value="">Semua Status</option>
            <option value="new">Baru (Menunggu)</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full text-xs h-9 px-2 border border-neutral-300 rounded-sm bg-white text-ink focus:outline-none focus:border-brand"
            title="Dari Tanggal"
          />
        </div>

        <div>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full text-xs h-9 px-2 border border-neutral-300 rounded-sm bg-white text-ink focus:outline-none focus:border-brand"
            title="Sampai Tanggal"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="sm" className="flex-1 justify-center">
            Filter
          </Button>
          {(search || status || dateFrom || dateTo) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-display uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Kode Pesanan</th>
                <th className="py-3 px-4 font-bold">Tanggal</th>
                <th className="py-3 px-4 font-bold">Pelanggan</th>
                <th className="py-3 px-4 font-bold text-center">Item</th>
                <th className="py-3 px-4 font-bold text-right">Total</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-text">
                    Tidak ada pesanan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ink">
                      {order.order_code}
                    </td>
                    <td className="py-3 px-4 text-muted-text whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-ink">{order.customer_name}</p>
                      <p className="text-[11px] text-muted-text">{order.customer_whatsapp}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {order.items_count} item
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-ink whitespace-nowrap">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link to={`/admin/pesanan/${order.id}`}>
                        <Button variant="outline" size="xs" icon={Eye}>
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-xs text-muted-text">
          <span>
            Menampilkan {orders.length} dari {total} pesanan
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <span className="font-mono font-semibold text-ink">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

