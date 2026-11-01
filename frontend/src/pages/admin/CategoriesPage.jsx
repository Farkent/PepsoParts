import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree, X, Check } from 'lucide-react';
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export default function CategoriesPage() {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, isEdit: false, data: { name: '', code: '', sort_order: '0', is_active: 1 } });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminGetCategories();
      setCategories(res?.data || []);
    } catch (err) {
      toastError(err.message || 'Gagal memuat kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setModal({
      open: true,
      isEdit: false,
      data: { name: '', code: '', sort_order: String(categories.length + 1), is_active: 1 },
    });
  };

  const handleOpenEdit = (cat) => {
    setModal({
      open: true,
      isEdit: true,
      data: {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        sort_order: String(cat.sort_order),
        is_active: Number(cat.is_active),
      },
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: modal.data.name,
        code: modal.data.code.toUpperCase(),
        sort_order: Number(modal.data.sort_order),
        is_active: Number(modal.data.is_active),
      };

      if (modal.isEdit) {
        await adminUpdateCategory(modal.data.id, payload);
        success('Kategori berhasil diperbarui.');
      } else {
        await adminCreateCategory(payload);
        success('Kategori baru berhasil ditambahkan.');
      }
      setModal({ open: false, isEdit: false, data: {} });
      fetchCategories();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori '${cat.name}'?`)) return;
    try {
      await adminDeleteCategory(cat.id);
      success('Kategori berhasil dihapus.');
      fetchCategories();
    } catch (err) {
      toastError(err.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
            MASTER DATA
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
            Kategori Suku Cadang
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            Kelola kategori utama dan kode 3 huruf untuk generator kode produk.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          + Tambah Kategori
        </Button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted-table uppercase tracking-wider font-display font-bold text-neutral-600 border-b border-neutral-200">
            <tr>
              <th className="py-3 px-4">Nama Kategori</th>
              <th className="py-3 px-4">Kode 3 Huruf</th>
              <th className="py-3 px-4">Slug URL</th>
              <th className="py-3 px-4 text-center">Urutan</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-muted-text">
                  Memuat data...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-muted-text">
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink">{c.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-display font-bold text-brand text-xs px-2 py-0.5 bg-orange-50 border border-orange-200 rounded-sm">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-text font-mono text-[11px]">{c.slug}</td>
                  <td className="py-3 px-4 text-center font-bold">{c.sort_order}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                        Number(c.is_active) === 1
                          ? 'bg-status-availableBg text-status-availableText border border-emerald-300'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {Number(c.is_active) === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-neutral-400 hover:text-ink transition-colors"
                      title="Edit kategori"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Hapus kategori"
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

      {/* Modal Tambah / Edit */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white max-w-sm w-full p-6 border border-neutral-300 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-display font-bold uppercase text-lg text-ink">
                {modal.isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setModal({ open: false, isEdit: false, data: {} })}
                className="text-neutral-400 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Nama Kategori"
                required
                placeholder="Contoh: Mesin"
                value={modal.data.name || ''}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
              />

              <Input
                label="Kode 3 Huruf"
                required
                maxLength={3}
                placeholder="Contoh: MSN"
                value={modal.data.code || ''}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })}
                helperText="Digunakan pada kode produk unik (PS-XXX-001)"
              />

              <Input
                label="Nomor Urutan Tampilan"
                type="number"
                value={modal.data.sort_order || '0'}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, sort_order: e.target.value } })}
              />

              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={Number(modal.data.is_active) === 1}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, is_active: e.target.checked ? 1 : 0 } })}
                  className="w-4 h-4 accent-brand"
                />
                <span>Kategori Aktif & Ditampilkan di Katalog</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModal({ open: false, isEdit: false, data: {} })}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
