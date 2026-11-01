import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bike, X } from 'lucide-react';
import {
  adminGetMotorTypes,
  adminCreateMotorType,
  adminUpdateMotorType,
  adminDeleteMotorType,
} from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export default function MotorTypesPage() {
  const { success, error: toastError } = useToast();
  const [motorTypes, setMotorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    isEdit: false,
    data: { name: '', year_from: '', year_to: '', notes: '', is_active: 1 },
  });
  const [saving, setSaving] = useState(false);

  const fetchMotorTypes = async () => {
    setLoading(true);
    try {
      const res = await adminGetMotorTypes();
      setMotorTypes(res?.data || []);
    } catch (err) {
      toastError(err.message || 'Gagal memuat tipe motor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorTypes();
  }, []);

  const handleOpenAdd = () => {
    setModal({
      open: true,
      isEdit: false,
      data: { name: '', year_from: '1996', year_to: '2015', notes: '', is_active: 1 },
    });
  };

  const handleOpenEdit = (m) => {
    setModal({
      open: true,
      isEdit: true,
      data: {
        id: m.id,
        name: m.name,
        year_from: m.year_from ? String(m.year_from) : '',
        year_to: m.year_to ? String(m.year_to) : '',
        notes: m.notes || '',
        is_active: Number(m.is_active),
      },
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: modal.data.name,
        year_from: modal.data.year_from ? Number(modal.data.year_from) : null,
        year_to: modal.data.year_to ? Number(modal.data.year_to) : null,
        notes: modal.data.notes,
        is_active: Number(modal.data.is_active),
      };

      if (modal.isEdit) {
        await adminUpdateMotorType(modal.data.id, payload);
        success('Tipe motor berhasil diperbarui.');
      } else {
        await adminCreateMotorType(payload);
        success('Tipe motor baru berhasil ditambahkan.');
      }
      setModal({ open: false, isEdit: false, data: {} });
      fetchMotorTypes();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan tipe motor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tipe motor '${m.name}'?`)) return;
    try {
      await adminDeleteMotorType(m.id);
      success('Tipe motor berhasil dihapus.');
      fetchMotorTypes();
    } catch (err) {
      toastError(err.message || 'Gagal menghapus tipe motor.');
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
            Tipe Motor Kawasaki Ninja 2-Tak
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            Kelola tipe dan varian motor untuk filter pencarian dan pengecekan kecocokan part.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          + Tambah Tipe Motor
        </Button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted-table uppercase tracking-wider font-display font-bold text-neutral-600 border-b border-neutral-200">
            <tr>
              <th className="py-3 px-4">Nama Tipe Motor</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Tahun Produksi</th>
              <th className="py-3 px-4">Keterangan / Catatan</th>
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
            ) : motorTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-muted-text">
                  Belum ada tipe motor.
                </td>
              </tr>
            ) : (
              motorTypes.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink flex items-center gap-2">
                    <Bike className="w-4 h-4 text-brand flex-shrink-0" />
                    <span>{m.name}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-text font-mono text-[11px]">{m.slug}</td>
                  <td className="py-3 px-4 font-semibold text-neutral-700">
                    {m.year_from || '—'} - {m.year_to || '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-text max-w-[200px] truncate">{m.notes || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                        Number(m.is_active) === 1
                          ? 'bg-status-availableBg text-status-availableText border border-emerald-300'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {Number(m.is_active) === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-neutral-400 hover:text-ink transition-colors"
                      title="Edit tipe motor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Hapus tipe motor"
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
                {modal.isEdit ? 'Edit Tipe Motor' : 'Tambah Tipe Motor'}
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
                label="Nama Tipe Motor"
                required
                placeholder="Contoh: Ninja RR 150"
                value={modal.data.name || ''}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Tahun Dari"
                  type="number"
                  placeholder="1996"
                  value={modal.data.year_from || ''}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, year_from: e.target.value } })}
                />
                <Input
                  label="Tahun Sampai"
                  type="number"
                  placeholder="2015"
                  value={modal.data.year_to || ''}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, year_to: e.target.value } })}
                />
              </div>

              <Textarea
                label="Catatan / Spesifikasi Singkat"
                rows={2}
                placeholder="Contoh: Tipe full fairing Old RR / New RR ZX150"
                value={modal.data.notes || ''}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })}
              />

              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={Number(modal.data.is_active) === 1}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, is_active: e.target.checked ? 1 : 0 } })}
                  className="w-4 h-4 accent-brand"
                />
                <span>Tipe Motor Aktif</span>
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
