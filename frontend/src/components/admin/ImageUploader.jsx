import React, { useState, useRef } from 'react';
import { Upload, Star, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';

export default function ImageUploader({
  productId,
  images = [],
  onImagesChange,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!productId) {
      alert('Simpan data produk terlebih dahulu sebelum mengunggah foto.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images[]', files[i]);
    }

    setUploading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': localStorage.getItem('pepso_csrf_token') || '',
        },
        credentials: 'include',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal mengunggah gambar');
      }

      if (json?.data?.images) {
        onImagesChange(json.data.images);
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat upload gambar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': localStorage.getItem('pepso_csrf_token') || '',
        },
        credentials: 'include',
        body: JSON.stringify({ is_primary: true }),
      });
      const json = await res.json();
      if (res.ok && json?.data?.images) {
        onImagesChange(json.data.images);
      }
    } catch (err) {
      alert('Gagal mengubah foto utama');
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': localStorage.getItem('pepso_csrf_token') || '',
        },
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json?.data?.images) {
        onImagesChange(json.data.images);
      }
    } catch (err) {
      alert('Gagal menghapus gambar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Foto Produk (Maks 10 MB per foto, otomatis dikonversi ke WebP)
          </label>
          <p className="text-xs text-muted-text mt-0.5">
            Dapat memilih banyak foto sekaligus atau langsung dari kamera HP.
          </p>
        </div>

        {productId && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="product-image-input"
            />
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              loading={uploading}
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              + Unggah Foto
            </Button>
          </div>
        )}
      </div>

      {!productId ? (
        <div className="p-6 border border-dashed border-neutral-300 rounded-sm text-center bg-neutral-50">
          <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs text-muted-text">
            Simpan data produk terlebih dahulu. Setelah tersimpan, Anda dapat mengunggah dan mengatur foto di sini.
          </p>
        </div>
      ) : images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-neutral-300 hover:border-brand rounded-sm text-center cursor-pointer bg-neutral-50 hover:bg-orange-50/30 transition-colors"
        >
          <Camera className="w-10 h-10 text-brand mx-auto mb-2" />
          <div className="font-display font-bold uppercase text-sm text-ink mb-1">
            Belum ada foto produk
          </div>
          <p className="text-xs text-muted-text">
            Klik di sini untuk memilih foto dari galeri atau kamera
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img) => {
            const isPrimary = Number(img.is_primary) === 1;
            return (
              <div
                key={img.id}
                className={`relative aspect-[4/3] border rounded-sm overflow-hidden bg-neutral-100 group ${
                  isPrimary ? 'border-brand ring-2 ring-brand' : 'border-neutral-200'
                }`}
              >
                <img
                  src={img.thumb_path || img.path}
                  alt="Foto Produk"
                  className="w-full h-full object-cover"
                />

                {/* Badge Foto Utama */}
                {isPrimary && (
                  <span className="absolute top-1.5 left-1.5 bg-brand text-white text-[10px] font-display font-bold px-1.5 py-0.5 rounded-sm">
                    UTAMA
                  </span>
                )}

                {/* Hover Action Bar */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      title="Jadikan Foto Utama"
                      className="p-2 bg-white text-ink hover:text-brand rounded-sm text-xs font-bold transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(img.id)}
                    title="Hapus Foto"
                    className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-sm text-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
