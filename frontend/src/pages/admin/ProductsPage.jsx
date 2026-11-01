import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit, Eye, AlertTriangle, X } from 'lucide-react';
import { adminGetProducts, adminDeleteProduct, getCategories } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Badge, { StatusBadge, GradeBadge } from '../../components/ui/Badge';
import { formatRupiah } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function ProductsPage() {
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);

  // Filters
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null, loading: false });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetProducts({
        q: query,
        category: categoryFilter,
        availability: statusFilter,
        page,
        per_page: perPage,
      });
      setProducts(res?.data || []);
      setTotal(res?.meta?.total || 0);
    } catch (err) {
      toastError(err.message || 'Gagal memuat produk.');
    } finally {
      setLoading(false);
    }
  }, [query, categoryFilter, statusFilter, page, perPage, toastError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res?.data || []))
      .catch(() => {});
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await adminDeleteProduct(deleteModal.product.id);
      success(`Produk ${deleteModal.product.name} berhasil dihapus.`);
      setDeleteModal({ open: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      toastError(err.message || 'Gagal menghapus produk.');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
            INVENTARIS
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
            Kelola Produk
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            Total {total} suku cadang terdaftar dalam sistem
          </p>
        </div>
        <div>
          <Link to="/admin/produk/tambah">
            <Button variant="primary" icon={Plus}>
              + Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau kode..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filter Kategori */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto text-xs border border-neutral-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-brand bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto text-xs border border-neutral-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-brand bg-white"
          >
            <option value="">Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="sold">Terjual</option>
            <option value="unavailable">Tidak Tersedia</option>
          </select>
        </div>
      </div>

      {/* Products Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-subtle overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-table uppercase tracking-wider font-display font-bold text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tipe Motor</th>
                <th className="py-3 px-4">Kondisi</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-muted-text">
                    Memuat data produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-muted-text">
                    Tidak ada produk yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primary_thumb || p.primary_image || '/uploads/sample_mesin_1.svg'}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-xs border border-neutral-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-ink max-w-[220px] truncate">{p.name}</div>
                          <div className="text-[11px] font-display font-bold text-brand uppercase">{p.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-700 whitespace-nowrap">
                      {p.category_name}
                    </td>
                    <td className="py-3 px-4 text-muted-text max-w-[150px] truncate">
                      {p.motor_types_text || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <GradeBadge grade={p.condition_grade} percent={p.condition_percent} />
                    </td>
                    <td className="py-3 px-4 font-bold text-ink whitespace-nowrap">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {p.stock}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={p.status} stock={p.stock} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <Link
                        to={`/produk/${p.slug}`}
                        target="_blank"
                        title="Lihat di katalog publik"
                        className="p-1.5 inline-block text-neutral-400 hover:text-brand"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/produk/edit/${p.id}`}
                        title="Edit produk"
                        className="p-1.5 inline-block text-neutral-400 hover:text-ink"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ open: true, product: p, loading: false })}
                        title="Hapus produk (soft delete)"
                        className="p-1.5 inline-block text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (Sesuai Bagian 5 O3: tabel menjadi daftar kartu di HP) */}
        <div className="md:hidden divide-y divide-neutral-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-text">Memuat produk...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-text">Tidak ada produk ditemukan.</div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex gap-3">
                  <img
                    src={p.primary_thumb || p.primary_image || '/uploads/sample_mesin_1.svg'}
                    alt={p.name}
                    className="w-16 h-16 object-cover rounded-xs border border-neutral-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-xs text-brand uppercase">{p.code}</span>
                      <StatusBadge status={p.status} stock={p.stock} />
                    </div>
                    <div className="font-bold text-sm text-ink truncate mt-0.5">{p.name}</div>
                    <div className="text-xs text-muted-text truncate mt-0.5">{p.motor_types_text}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                  <div className="font-bold text-base text-ink">{formatRupiah(p.price)}</div>
                  <div className="text-muted-text">Stok: <span className="font-bold text-ink">{p.stock}</span></div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link to={`/admin/produk/edit/${p.id}`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth icon={Edit}>
                      Edit
                    </Button>
                  </Link>
                  <button
                    onClick={() => setDeleteModal({ open: true, product: p, loading: false })}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-sm text-xs font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginasi */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-xs text-muted-text">
            <div>
              Menampilkan Halaman {page} dari {totalPages} ({total} produk)
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹ Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus (Soft Delete) */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white max-w-sm w-full p-6 border border-neutral-300 rounded-sm shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-display font-bold uppercase text-lg text-ink">
                Hapus Produk?
              </h3>
            </div>
            <p className="text-xs text-muted-text leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus produk <strong>{deleteModal.product?.name}</strong> ({deleteModal.product?.code})?
              Data akan di-soft delete dan tidak akan tampil lagi di katalog publik.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModal({ open: false, product: null, loading: false })}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteModal.loading}
                onClick={handleDeleteConfirm}
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

