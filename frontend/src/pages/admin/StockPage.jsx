import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Check, XCircle, ShoppingBag, Eye, RefreshCw } from 'lucide-react';
import { adminGetProducts, adminPatchStock, adminPatchStatus } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { formatRupiah } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export default function StockPage() {
  const { success, error: toastError, info } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetProducts({
        q: query,
        availability: statusFilter,
        per_page: 50,
      });
      setProducts(res?.data || []);
    } catch (err) {
      toastError(err.message || 'Gagal memuat daftar stok.');
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, toastError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStockChange = async (productId, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingId(productId);
    try {
      const res = await adminPatchStock(productId, { stock: newStock });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock: res.data.stock, status: res.data.status } : p
        )
      );
      success(`Stok produk berhasil diperbarui menjadi ${newStock}.`);
    } catch (err) {
      toastError(err.message || 'Gagal mengubah stok.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusAction = async (productId, actionName, productName) => {
    setUpdatingId(productId);
    try {
      const res = await adminPatchStatus(productId, { action: actionName });
      const updated = res?.data?.product;
      if (updated) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, ...updated } : p))
        );
      } else {
        fetchProducts();
      }
      success(`Status ${productName} berhasil diperbarui.`);
    } catch (err) {
      toastError(err.message || 'Gagal mengubah status produk.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
          INVENTARIS CEPAT
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
          Kelola Stok Produk
        </h1>
        <p className="text-xs text-muted-text mt-0.5">
          Perbarui jumlah stok barang dan ubah status penjualan langsung dalam 1 klik.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau kode produk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto text-xs border border-neutral-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-brand bg-white"
          >
            <option value="">Semua Status</option>
            <option value="available">Tersedia (Ready)</option>
            <option value="sold">Terjual</option>
            <option value="unavailable">Tidak Tersedia</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchProducts} icon={RefreshCw}>
            Segarkan
          </Button>
        </div>
      </div>

      {/* Stock Table / List */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-subtle overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-table uppercase tracking-wider font-display font-bold text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4 text-center">Jumlah Stok</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted-text">
                    Memuat data stok...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted-text">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isBusy = updatingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primary_thumb || p.primary_image || '/uploads/sample_mesin_1.svg'}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-xs border border-neutral-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-ink max-w-[260px] truncate">{p.name}</div>
                            <div className="text-[11px] font-display font-bold text-brand uppercase">{p.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-ink whitespace-nowrap">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 border border-neutral-200 rounded-sm p-0.5 bg-neutral-50">
                          <button
                            type="button"
                            disabled={p.stock <= 0 || isBusy}
                            onClick={() => handleStockChange(p.id, p.stock, -1)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-ink hover:bg-neutral-200 rounded-xs disabled:opacity-30"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-bold text-sm text-ink">{p.stock}</span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleStockChange(p.id, p.stock, 1)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-ink hover:bg-neutral-200 rounded-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={p.status} stock={p.stock} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {p.status !== 'sold' ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleStatusAction(p.id, 'sell', p.name)}
                            className="px-2.5 py-1 text-xs border border-neutral-300 hover:border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white rounded-sm font-bold uppercase transition-colors"
                          >
                            Tandai Terjual
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy || p.stock <= 0}
                            onClick={() => handleStatusAction(p.id, 'activate', p.name)}
                            title={p.stock <= 0 ? 'Tambah stok terlebih dahulu untuk mengaktifkan' : ''}
                            className="px-2.5 py-1 text-xs border border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-sm font-bold uppercase transition-colors disabled:opacity-40"
                          >
                            Aktifkan Lagi
                          </button>
                        )}

                        {p.status !== 'unavailable' ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleStatusAction(p.id, 'unavailable', p.name)}
                            className="px-2.5 py-1 text-xs border border-neutral-200 text-neutral-500 hover:bg-neutral-200 rounded-sm font-bold uppercase transition-colors"
                          >
                            Tidak Tersedia
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleStatusAction(p.id, 'activate', p.name)}
                            className="px-2.5 py-1 text-xs border border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-sm font-bold uppercase transition-colors"
                          >
                            Aktifkan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-neutral-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-text">Memuat stok...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-text">Tidak ada produk ditemukan.</div>
          ) : (
            products.map((p) => {
              const isBusy = updatingId === p.id;
              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display font-bold text-xs text-brand uppercase">{p.code}</span>
                      <div className="font-bold text-sm text-ink">{p.name}</div>
                      <div className="text-xs text-muted-text mt-0.5">{formatRupiah(p.price)}</div>
                    </div>
                    <StatusBadge status={p.status} stock={p.stock} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-xs font-bold uppercase text-neutral-600">Jumlah Stok:</span>
                    <div className="inline-flex items-center gap-1 border border-neutral-200 rounded-sm p-0.5 bg-neutral-50">
                      <button
                        type="button"
                        disabled={p.stock <= 0 || isBusy}
                        onClick={() => handleStockChange(p.id, p.stock, -1)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 rounded-xs disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-ink">{p.stock}</span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStockChange(p.id, p.stock, 1)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 rounded-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {p.status !== 'sold' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        disabled={isBusy}
                        onClick={() => handleStatusAction(p.id, 'sell', p.name)}
                      >
                        Tandai Terjual
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        disabled={isBusy || p.stock <= 0}
                        onClick={() => handleStatusAction(p.id, 'activate', p.name)}
                      >
                        Aktifkan Lagi
                      </Button>
                    )}

                    {p.status !== 'unavailable' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        disabled={isBusy}
                        onClick={() => handleStatusAction(p.id, 'unavailable', p.name)}
                      >
                        Tidak Tersedia
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        disabled={isBusy}
                        onClick={() => handleStatusAction(p.id, 'activate', p.name)}
                      >
                        Aktifkan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
