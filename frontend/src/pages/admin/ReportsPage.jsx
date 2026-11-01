import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { adminGetStockReport, adminGetOrderReport } from '../../api/endpoints';
import { formatRupiah, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'sales'

  // Stock State
  const [stockData, setStockData] = useState([]);
  const [stockMeta, setStockMeta] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  // Sales State
  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [salesData, setSalesData] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);

  // Load Stock Report
  const fetchStock = async () => {
    setStockLoading(true);
    try {
      const res = await adminGetStockReport('json');
      if (res.data && res.data.success) {
        setStockData(res.data.data);
        setStockMeta(res.data.meta || {});
      }
    } catch (err) {
      console.error('Fetch stock report error:', err);
    } finally {
      setStockLoading(false);
    }
  };

  // Load Sales Report
  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const res = await adminGetOrderReport({ date_from: dateFrom, date_to: dateTo });
      if (res.data && res.data.success) {
        setSalesData(res.data.data);
      }
    } catch (err) {
      console.error('Fetch sales report error:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchStock();
    } else {
      fetchSales();
    }
  }, [activeTab]);

  const handleExportStockCsv = () => {
    window.open('/api/admin/reports/stock?format=csv', '_blank');
  };

  const handleExportSalesCsv = () => {
    window.open(`/api/admin/reports/orders?date_from=${dateFrom}&date_to=${dateTo}&format=csv`, '_blank');
  };

  const setPresetRange = (type) => {
    const end = new Date().toISOString().slice(0, 10);
    setDateTo(end);

    if (type === 'this_month') {
      setDateFrom(firstDayOfMonth);
    } else if (type === '7_days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDateFrom(d.toISOString().slice(0, 10));
    } else if (type === '30_days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setDateFrom(d.toISOString().slice(0, 10));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-ink">
            Laporan & Rekapitulasi
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            Unduh dan pantau laporan nilai stok barang serta omset penjualan berkala
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-neutral-200 p-0.5 rounded-sm">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
              activeTab === 'stock'
                ? 'bg-white text-ink shadow-sm'
                : 'text-neutral-600 hover:text-ink'
            }`}
          >
            Laporan Stok
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
              activeTab === 'sales'
                ? 'bg-white text-ink shadow-sm'
                : 'text-neutral-600 hover:text-ink'
            }`}
          >
            Laporan Penjualan
          </button>
        </div>
      </div>

      {/* ─── TAB 1: LAPORAN STOK ────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-text uppercase font-semibold">Total Jenis Produk</p>
                <p className="font-display text-2xl font-extrabold text-ink mt-0.5">
                  {stockMeta.total_products ?? 0} Jenis
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 text-brand rounded-sm flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-text uppercase font-semibold">Total Nilai Estimasi Stok</p>
                <p className="font-display text-2xl font-extrabold text-brand mt-0.5">
                  {formatRupiah(stockMeta.total_stock_value ?? 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-sm flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Export Action */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportStockCsv}
            >
              Export CSV Stok (Excel)
            </Button>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-display uppercase tracking-wider text-neutral-600">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Kode</th>
                    <th className="py-2.5 px-4 font-bold">Nama Suku Cadang</th>
                    <th className="py-2.5 px-4 font-bold">Kategori</th>
                    <th className="py-2.5 px-4 font-bold text-right">Harga (Rp)</th>
                    <th className="py-2.5 px-4 font-bold text-center">Stok</th>
                    <th className="py-2.5 px-4 font-bold text-center">Status</th>
                    <th className="py-2.5 px-4 font-bold text-right">Nilai Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {stockLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="p-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : stockData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-text">
                        Tidak ada data stok.
                      </td>
                    </tr>
                  ) : (
                    stockData.map((p) => {
                      const totalVal = (Number(p.price) || 0) * (Number(p.stock) || 0);
                      return (
                        <tr key={p.id} className="hover:bg-neutral-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-brand">{p.product_code}</td>
                          <td className="py-2.5 px-4 font-semibold text-ink">{p.name}</td>
                          <td className="py-2.5 px-4 text-muted-text">{p.category || '-'}</td>
                          <td className="py-2.5 px-4 text-right font-mono">{formatRupiah(p.price)}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold">{p.stock}</td>
                          <td className="py-2.5 px-4 text-center">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-ink">
                            {formatRupiah(totalVal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LAPORAN PENJUALAN ───────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="bg-white border border-neutral-200 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-ink">Periode:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs h-8 px-2 border border-neutral-300 rounded-sm"
              />
              <span className="text-xs text-muted-text">s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs h-8 px-2 border border-neutral-300 rounded-sm"
              />
              <Button variant="primary" size="xs" onClick={fetchSales}>
                Terapkan
              </Button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPresetRange('this_month')}
                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-ink rounded-sm font-medium"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('7_days')}
                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-ink rounded-sm font-medium"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('30_days')}
                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-ink rounded-sm font-medium"
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Sales Summary Cards */}
          {salesData && salesData.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200 rounded-sm p-4">
                <p className="text-[11px] text-muted-text uppercase font-semibold">Total Pesanan</p>
                <p className="font-display text-2xl font-extrabold text-ink mt-0.5">
                  {salesData.summary.total_orders}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-sm p-4">
                <p className="text-[11px] text-muted-text uppercase font-semibold">Total Pendapatan</p>
                <p className="font-display text-2xl font-extrabold text-brand mt-0.5">
                  {formatRupiah(salesData.summary.total_revenue)}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-sm p-4">
                <p className="text-[11px] text-muted-text uppercase font-semibold">Pesanan Selesai</p>
                <p className="font-display text-2xl font-extrabold text-emerald-600 mt-0.5">
                  {salesData.summary.completed_orders}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-sm p-4">
                <p className="text-[11px] text-muted-text uppercase font-semibold">Pesanan Dibatalkan</p>
                <p className="font-display text-2xl font-extrabold text-red-500 mt-0.5">
                  {salesData.summary.cancelled_orders}
                </p>
              </div>
            </div>
          )}

          {/* Export Action */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportSalesCsv}
            >
              Export CSV Penjualan (Excel)
            </Button>
          </div>

          {/* Sales by Category & Orders List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By Category */}
            <div className="bg-white border border-neutral-200 rounded-sm p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink border-b border-neutral-200 pb-2 mb-3">
                Penjualan per Kategori
              </h3>
              {salesLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : !salesData || salesData.by_category?.length === 0 ? (
                <p className="text-xs text-muted-text py-4 text-center">Belum ada data penjualan.</p>
              ) : (
                <div className="space-y-3">
                  {salesData.by_category.map((cat, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-ink">
                        <span>{cat.category || 'Tanpa Kategori'}</span>
                        <span className="font-mono">{formatRupiah(cat.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-text">
                        <span>{cat.items_sold} item terjual</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders in Period */}
            <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                  Daftar Pesanan dalam Periode
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 font-display uppercase tracking-wider text-neutral-600">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Kode</th>
                      <th className="py-2.5 px-4 font-bold">Pelanggan</th>
                      <th className="py-2.5 px-4 font-bold text-center">Item</th>
                      <th className="py-2.5 px-4 font-bold text-right">Total</th>
                      <th className="py-2.5 px-4 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {salesLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="p-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : !salesData || salesData.orders?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-text">
                          Tidak ada pesanan pada rentang tanggal ini.
                        </td>
                      </tr>
                    ) : (
                      salesData.orders.map((o, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-ink">{o.order_code}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-ink">{o.customer_name}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono">{o.items_count}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-ink">
                            {formatRupiah(o.total_amount)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <StatusBadge status={o.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

