import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, RefreshCw, Sparkles, Check, Plus, Trash2 } from 'lucide-react';
import {
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminNextCode,
  adminAiDescribeProduct,
  getCategories,
  getMotorTypes,
} from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import ImageUploader from '../../components/admin/ImageUploader';
import { useToast } from '../../context/ToastContext';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [motorTypes, setMotorTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    price: '',
    stock: '1',
    status: 'available',
    condition_grade: 'good',
    condition_percent: '85',
    condition_note: '',
    compat_notes: '',
    description: '',
    motor_type_ids: [],
    primary_motor_id: '',
  });

  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [generatingAiDesc, setGeneratingAiDesc] = useState(false);

  const handleGenerateAiDescription = async () => {
    setGeneratingAiDesc(true);
    try {
      const catObj = categories.find((c) => String(c.id) === String(formData.category_id));
      const res = await adminAiDescribeProduct({
        product_name: formData.name,
        category_name: catObj?.name || '',
        notes: formData.condition_note || formData.compat_notes || '',
      });

      const desc = res?.data?.description || res?.description;
      if (desc) {
        setFormData((prev) => ({
          ...prev,
          description: desc,
        }));
        success('Draf deskripsi AI berhasil dibuat!');
      } else {
        toastError(res?.error?.message || 'Gagal membuat deskripsi AI.');
      }
    } catch (err) {
      console.error('AI describe error:', err);
      toastError(err.message || 'Terjadi kesalahan saat memproses deskripsi AI.');
    } finally {
      setGeneratingAiDesc(false);
    }
  };

  useEffect(() => {
    Promise.all([getCategories(), getMotorTypes()])
      .then(([catsRes, motorsRes]) => {
        setCategories(catsRes?.data || []);
        setMotorTypes(motorsRes?.data || []);
      })
      .catch(() => {});

    if (isEdit) {
      setLoading(true);
      adminGetProduct(id)
        .then((res) => {
          const p = res?.data;
          if (p) {
            const motorIds = (p.motor_types || []).map((m) => m.id);
            const primaryMotor = (p.motor_types || []).find((m) => Number(m.is_primary) === 1);

            setFormData({
              name: p.name || '',
              code: p.code || '',
              category_id: String(p.category_id || ''),
              price: String(p.price || ''),
              stock: String(p.stock ?? 1),
              status: p.status || 'available',
              condition_grade: p.condition_grade || 'good',
              condition_percent: p.condition_percent ? String(p.condition_percent) : '',
              condition_note: p.condition_note || '',
              compat_notes: p.compat_notes || '',
              description: p.description || '',
              motor_type_ids: motorIds,
              primary_motor_id: primaryMotor ? String(primaryMotor.id) : (motorIds[0] ? String(motorIds[0]) : ''),
            });

            setImages(p.images || []);
            setVariants(
              (p.variants || []).map((v) => ({
                id: v.id,
                name: v.name,
                price: String(v.price),
                stock: String(v.stock),
                image_id: v.image_id || 0,
              }))
            );
          }
        })
        .catch((err) => {
          toastError(err.message || 'Gagal memuat produk.');
          navigate('/admin/produk');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate, toastError]);

  // Handle otomatis saran kode produk saat memilih kategori baru
  const handleCategoryChange = async (catId) => {
    setFormData((prev) => ({ ...prev, category_id: catId }));
    if (!isEdit && catId) {
      try {
        const res = await adminNextCode(catId);
        if (res?.data?.code) {
          setFormData((prev) => ({ ...prev, code: res.data.code }));
        }
      } catch {}
    }
  };

  const handleGenerateCode = async () => {
    if (!formData.category_id) {
      alert('Pilih kategori terlebih dahulu');
      return;
    }
    try {
      const res = await adminNextCode(formData.category_id);
      if (res?.data?.code) {
        setFormData((prev) => ({ ...prev, code: res.data.code }));
      }
    } catch {}
  };

  const handleMotorCheckbox = (motorId) => {
    setFormData((prev) => {
      const current = [...prev.motor_type_ids];
      const idx = current.indexOf(motorId);
      let updated;
      if (idx > -1) {
        updated = current.filter((m) => m !== motorId);
      } else {
        updated = [...current, motorId];
      }

      let primary = prev.primary_motor_id;
      if (!updated.includes(Number(primary))) {
        primary = updated[0] ? String(updated[0]) : '';
      }

      return {
        ...prev,
        motor_type_ids: updated,
        primary_motor_id: primary,
      };
    });
  };

  const addVariant = () =>
    setVariants((prev) => [...prev, { id: 0, name: '', price: '', stock: '1', image_id: 0 }]);

  const updateVariant = (index, field, value) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));

  const removeVariant = (index) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));

  const hasVariants = variants.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      price: Number(formData.price),
      stock: Number(formData.stock),
      condition_percent: formData.condition_percent ? Number(formData.condition_percent) : null,
      motor_type_ids: formData.motor_type_ids.map(Number),
      primary_motor_id: formData.primary_motor_id ? Number(formData.primary_motor_id) : 0,
      variants: variants.map((v) => ({
        id: v.id || 0,
        name: v.name.trim(),
        price: Number(v.price),
        stock: Number(v.stock),
        image_id: v.image_id || 0,
      })),
    };

    try {
      if (isEdit) {
        await adminUpdateProduct(id, payload);
        success('Produk berhasil diperbarui.');
      } else {
        const res = await adminCreateProduct(payload);
        success('Produk baru berhasil ditambahkan.');
        if (res?.data?.id) {
          navigate(`/admin/produk/edit/${res.data.id}`, { replace: true });
          return;
        }
      }
      navigate('/admin/produk');
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      }
      toastError(err.message || 'Gagal menyimpan data produk.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-text font-display uppercase tracking-wider">
        Memuat data produk...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/produk"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-text hover:text-ink transition-colors uppercase font-display"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Produk</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
          {isEdit ? 'PERBARUI SUKU CADANG' : 'TAMBAH SUKU CADANG BARU'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
          {isEdit ? `Edit: ${formData.name || 'Produk'}` : 'Tambah Produk Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informasi Pokok */}
        <div className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle space-y-4">
          <h2 className="font-display font-bold uppercase text-base text-ink pb-2 border-b border-neutral-100">
            1. Informasi Pokok
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nama Produk"
                required
                placeholder="Contoh: Blok Seher Ninja RR Original Seri 1855"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                Kategori <span className="text-brand">*</span>
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 focus:outline-none focus:border-brand bg-white"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {errors.category_id && <span className="text-xs text-red-600 font-medium">{errors.category_id}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Kode Produk <span className="text-brand">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[11px] text-brand font-bold uppercase hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Usulkan Kode
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="PS-MSN-024"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 font-display font-bold uppercase tracking-wider focus:outline-none focus:border-brand"
              />
              {errors.code && <span className="text-xs text-red-600 font-medium">{errors.code}</span>}
            </div>
          </div>
        </div>

        {/* Card 2: Harga, Stok & Status */}
        <div className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle space-y-4">
          <h2 className="font-display font-bold uppercase text-base text-ink pb-2 border-b border-neutral-100">
            2. Harga, Stok & Ketersediaan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label={hasVariants ? 'Harga (otomatis dari varian)' : 'Harga (Rp)'}
                type="number"
                required={!hasVariants}
                disabled={hasVariants}
                placeholder="1250000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={errors.price}
              />
            </div>

            <div>
              <Input
                label={hasVariants ? 'Total Stok (otomatis dari varian)' : 'Jumlah Stok'}
                type="number"
                min="0"
                required={!hasVariants}
                disabled={hasVariants}
                placeholder="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                error={errors.stock}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                Status Ketersediaan
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 focus:outline-none focus:border-brand bg-white"
              >
                <option value="available">Tersedia (Available)</option>
                <option value="sold">Terjual (Sold)</option>
                <option value="unavailable">Tidak Tersedia</option>
              </select>
            </div>
          </div>

          {/* Varian Produk */}
          <div className="pt-4 mt-4 border-t border-neutral-100 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Varian Produk (Opsional)
                </div>
                <p className="text-xs text-muted-text mt-0.5">
                  Isi bila barang ini punya pilihan, misalnya &quot;Mur saja&quot;, &quot;Mangkuk saja&quot;,
                  &quot;Mur + Mangkuk&quot;. Pelanggan wajib memilih salah satu saat memesan, dan tiap varian
                  punya harga dan stok sendiri. Kosongkan bila produk hanya satu jenis.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addVariant}>
                Tambah Varian
              </Button>
            </div>

            {hasVariants && (
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-text px-1">
                  <div className="col-span-5">Nama Varian</div>
                  <div className="col-span-3">Harga (Rp)</div>
                  <div className="col-span-3">Stok</div>
                  <div className="col-span-1" />
                </div>
                {variants.map((v, i) => (
                  <div key={v.id || `new-${i}`} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="cth: Mur + Mangkuk"
                      value={v.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                      className="col-span-12 sm:col-span-5 text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 focus:outline-none focus:border-brand bg-white"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Harga"
                      value={v.price}
                      onChange={(e) => updateVariant(i, 'price', e.target.value)}
                      className="col-span-5 sm:col-span-3 text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 focus:outline-none focus:border-brand bg-white"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Stok"
                      value={v.stock}
                      onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                      className="col-span-5 sm:col-span-3 text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 focus:outline-none focus:border-brand bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      title="Hapus varian"
                      className="col-span-2 sm:col-span-1 p-2 text-neutral-400 hover:text-red-600 justify-self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Pilih foto untuk varian ini (dari foto produk yang sudah diunggah) */}
                    <div className="col-span-12 flex items-center gap-1.5 flex-wrap pb-2 border-b border-neutral-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text mr-1">
                        Foto varian:
                      </span>
                      {images.length === 0 ? (
                        <span className="text-[11px] text-muted-text">
                          Unggah foto produk dulu di bagian &quot;Foto Produk&quot; di bawah, lalu simpan dan pilih fotonya di sini.
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => updateVariant(i, 'image_id', 0)}
                            className={`px-2 h-14 text-[10px] font-bold uppercase border rounded-sm ${
                              !v.image_id ? 'border-brand bg-orange-50 text-brand' : 'border-neutral-300 text-neutral-500'
                            }`}
                          >
                            Tanpa foto
                          </button>
                          {images.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              title="Klik untuk memilih foto ini"
                              onClick={() => updateVariant(i, 'image_id', Number(img.id))}
                              className={`relative w-14 h-14 rounded-sm overflow-hidden transition-opacity ${
                                Number(v.image_id) === Number(img.id)
                                  ? 'ring-2 ring-brand ring-offset-2'
                                  : 'ring-1 ring-neutral-300 opacity-50 hover:opacity-100'
                              }`}
                            >
                              <img src={img.thumb_path || img.path} alt="" className="w-full h-full object-cover" />
                              {Number(v.image_id) === Number(img.id) && (
                                <span className="absolute top-0.5 right-0.5 bg-brand text-white rounded-full w-4 h-4 flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                      {images.length > 0 && (
                        <span className="w-full text-[11px] font-semibold text-brand">
                          {(() => {
                            const at = images.findIndex((im) => Number(im.id) === Number(v.image_id));
                            return at >= 0 ? `✓ Foto terpilih: foto ke-${at + 1}` : 'Belum ada foto dipilih (klik salah satu foto di atas)';
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-text">
                  Katalog menampilkan harga varian termurah, dan stok total dihitung dari semua varian.
                </p>
              </div>
            )}
            {errors.variants && <span className="text-xs text-red-600 font-medium">{errors.variants}</span>}
          </div>
        </div>

        {/* Card 3: Kondisi Barang */}
        <div className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle space-y-4">
          <h2 className="font-display font-bold uppercase text-base text-ink pb-2 border-b border-neutral-100">
            3. Kondisi Barang Bekas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                Grade Kondisi
              </label>
              <select
                value={formData.condition_grade}
                onChange={(e) => setFormData({ ...formData, condition_grade: e.target.value })}
                className="w-full text-base sm:text-sm border border-neutral-300 rounded-sm px-3 py-2.5 focus:outline-none focus:border-brand bg-white"
              >
                <option value="excellent">Mulus (Excellent)</option>
                <option value="good">Bagus (Good)</option>
                <option value="fair">Normal (Fair)</option>
                <option value="poor">Minus (Poor)</option>
              </select>
            </div>

            <div>
              <Input
                label="Persentase Kondisi (%)"
                type="number"
                min="1"
                max="100"
                placeholder="Contoh: 85"
                value={formData.condition_percent}
                onChange={(e) => setFormData({ ...formData, condition_percent: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Catatan Kondisi Singkat"
                placeholder="Contoh: Boring mulus no baret, lubang KIPS lancar"
                value={formData.condition_note}
                onChange={(e) => setFormData({ ...formData, condition_note: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Tipe Motor yang Cocok */}
        <div className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h2 className="font-display font-bold uppercase text-base text-ink">
              4. Kecocokan Tipe Motor
            </h2>
            <span className="text-xs text-muted-text">Pilih tipe motor & tandai satu sebagai Utama</span>
          </div>

          <div className="space-y-2">
            {motorTypes.map((mt) => {
              const isChecked = formData.motor_type_ids.includes(mt.id);
              const isPrimary = String(formData.primary_motor_id) === String(mt.id);

              return (
                <div
                  key={mt.id}
                  className={`p-3 border rounded-sm flex items-center justify-between transition-colors ${
                    isChecked ? 'border-neutral-400 bg-neutral-50/50' : 'border-neutral-200'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMotorCheckbox(mt.id)}
                      className="w-4 h-4 accent-brand"
                    />
                    <div>
                      <div className="text-sm font-bold text-ink">{mt.name}</div>
                      <div className="text-[11px] text-muted-text">{mt.notes || 'Universal'}</div>
                    </div>
                  </label>

                  {isChecked && (
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 cursor-pointer">
                      <input
                        type="radio"
                        name="primary_motor"
                        checked={isPrimary}
                        onChange={() => setFormData({ ...formData, primary_motor_id: String(mt.id) })}
                        className="accent-brand"
                      />
                      <span>Tipe Utama</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <Textarea
            label="Catatan Kecocokan Khusus (Opsional)"
            placeholder="Contoh: Khusus Ninja RR 150. Lubang baut knalpot dan porting berbeda dengan Ninja R Super KIPS."
            rows={2}
            value={formData.compat_notes}
            onChange={(e) => setFormData({ ...formData, compat_notes: e.target.value })}
          />
        </div>

        {/* Card 5: Deskripsi */}
        <div className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100">
            <div>
              <h2 className="font-display font-bold uppercase text-base text-ink flex items-center gap-2">
                5. Deskripsi Lengkap
                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-mono uppercase font-semibold">
                  AI Powered
                </span>
              </h2>
            </div>
            <button
              type="button"
              disabled={generatingAiDesc}
              onClick={handleGenerateAiDescription}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-brand text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm hover:from-orange-600 hover:to-brand-dark transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generatingAiDesc ? 'animate-spin' : ''}`} />
              {generatingAiDesc ? 'Menyusun Draf...' : '⚡ Buat Draf dengan AI'}
            </button>
          </div>

          <Textarea
            label="Deskripsi Produk"
            rows={5}
            placeholder="Tuliskan spesifikasi detail fisik, kelengkapan, riwayat copotan motor..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Card 6: Foto Produk */}
        <div className="bg-white border border-neutral-200 p-5 rounded-sm shadow-subtle space-y-4">
          <h2 className="font-display font-bold uppercase text-base text-ink pb-2 border-b border-neutral-100">
            6. Foto Produk
          </h2>

          <ImageUploader
            productId={isEdit ? Number(id) : null}
            images={images}
            onImagesChange={(newImgs) => setImages(newImgs)}
          />
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="sticky bottom-4 z-20 bg-white border border-neutral-300 p-4 rounded-sm shadow-xl flex items-center justify-between">
          <Link to="/admin/produk">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit" variant="primary" icon={Save} loading={saving}>
            {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
          </Button>
        </div>
      </form>
    </div>
  );
}

