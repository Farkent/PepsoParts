import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Copy, Check, Share2, MessageCircle, ShoppingCart,
  ChevronLeft, ChevronRight, AlertTriangle, Bike, ZoomIn
} from 'lucide-react';
import { getProduct, getRelatedProducts } from '../../api/endpoints';
import { useCart } from '../../context/CartContext';
import { useMotor } from '../../context/MotorContext';
import { useToast } from '../../context/ToastContext';
import { formatRupiah, buildWhatsAppUrl } from '../../utils/format';
import Badge, { StatusBadge, GradeBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ProductCard from '../../components/catalog/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { selectedMotor } = useMotor();
  const { success, error: showError } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [waSettings, setWaSettings] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setProduct(null);
    setActiveImageIndex(0);

    getProduct(slug)
      .then((res) => {
        if (!mounted) return;
        if (!res?.data) { navigate('/404', { replace: true }); return; }
        setProduct(res.data);

        // Ambil produk terkait
        return getRelatedProducts(res.data.id);
      })
      .then((res) => {
        if (mounted && res?.data) setRelated(res.data.slice(0, 4));
      })
      .catch(() => {
        if (mounted) navigate('/404', { replace: true });
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [slug]);

  // Ambil nomor WA dari settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(res => setWaSettings(res?.data?.whatsapp_number || ''))
      .catch(() => {});
  }, []);

  const handleCopyCode = () => {
    if (!product) return;
    navigator.clipboard.writeText(product.code).then(() => {
      setCodeCopied(true);
      success(`Kode produk ${product.code} disalin!`);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!product) return;
    const url = window.location.href;
    const text = `${product.name} (${product.code}) - ${formatRupiah(product.price)} | PEPSO PARTS`;

    if (navigator.share) {
      navigator.share({ title: text, url });
    } else {
      navigator.clipboard.writeText(url);
      success('Tautan produk disalin ke clipboard!');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const ok = addItem(product);
    if (ok) success(`${product.name} ditambahkan ke keranjang.`);
  };

  const buildWaUrl = () => {
    if (!product || !waSettings) return '#';
    const appUrl = window.location.origin;
    const msg = `Halo PEPSO PARTS, saya tertarik dengan:\n${product.name} (Kode: ${product.code})\nHarga: ${formatRupiah(product.price)}\nMotor: ${product.motor_types_text || '-'}\nLink: ${appUrl}/produk/${product.slug}`;
    return buildWhatsAppUrl(waSettings, msg);
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  const images = product.images?.length ? product.images : [{ path: product.primary_image, thumb_path: product.primary_thumb, id: 0 }];
  const activeImage = images[activeImageIndex];

  const isAvailable = product.status === 'available' && product.stock > 0;

  // Pengecekan kecocokan motor (deterministik)
  let compatStatus = 'unknown';
  let compatMessage = '';
  if (selectedMotor && product.motor_types?.length > 0) {
    const motorSlugs = product.motor_types.map(m => m.slug);
    if (motorSlugs.includes(selectedMotor.slug)) {
      compatStatus = 'compatible';
      compatMessage = `Part ini cocok untuk ${selectedMotor.name} Anda.`;
    } else {
      compatStatus = 'incompatible';
      compatMessage = `Barang ini untuk ${product.motor_types_text}. Motor Anda (${selectedMotor.name}) kemungkinan tidak cocok.`;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted-text">
        <Link to="/" className="hover:text-brand">Katalog</Link>
        <span>›</span>
        <Link to={`/?kategori=${product.category_slug}`} className="hover:text-brand">{product.category_name}</Link>
        <span>›</span>
        <span className="text-ink font-medium">{product.code}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ──── Kolom Kiri: Galeri ──── */}
        <div>
          {/* Gambar Utama */}
          <div
            className="relative aspect-[4/3] bg-muted-bg border border-neutral-200 overflow-hidden cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            {activeImage?.path ? (
              <img
                src={activeImage.path}
                alt={product.name}
                className={`w-full h-full object-contain ${!isAvailable ? 'grayscale opacity-70' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-text flex-col gap-2">
                <span className="text-6xl">🔧</span>
                <span className="text-xs font-display uppercase">Belum ada foto</span>
              </div>
            )}
            <div className="absolute top-3 left-3"><StatusBadge status={product.status} stock={product.stock} /></div>
            <div className="absolute bottom-3 right-3 p-1.5 bg-black/40 text-white rounded-sm">
              <ZoomIn className="w-4 h-4" />
            </div>

            {/* Navigasi Gambar */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => Math.max(0, i - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/40 text-white rounded-sm disabled:opacity-30"
                  disabled={activeImageIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => Math.min(images.length - 1, i + 1)); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/40 text-white rounded-sm disabled:opacity-30"
                  disabled={activeImageIndex === images.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Galeri */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 border-2 rounded-sm overflow-hidden ${i === activeImageIndex ? 'border-brand' : 'border-transparent'}`}
                >
                  <img src={img.thumb_path || img.path} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ──── Kolom Kanan: Info Produk ──── */}
        <div className="flex flex-col gap-4">
          {/* Kategori */}
          <div>
            <Badge variant="brandLight" size="sm">{product.category_name}</Badge>
          </div>

          {/* Nama & Kode */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink uppercase leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-base font-bold font-display text-brand">{product.code}</span>
              <button
                onClick={handleCopyCode}
                title="Salin kode produk"
                className="p-1.5 text-neutral-400 hover:text-brand border border-neutral-200 rounded-sm transition-colors"
              >
                {codeCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-text mt-1">Sebutkan kode ini saat menghubungi kami agar barang tidak tertukar.</p>
          </div>

          {/* Harga */}
          <div className="text-3xl font-display font-extrabold text-ink">
            {formatRupiah(product.price)}
          </div>

          {/* Kondisi & Stok */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted-bg border border-neutral-200 rounded-sm text-xs">
            <div>
              <div className="text-muted-text font-bold uppercase mb-1">Kondisi</div>
              <GradeBadge grade={product.condition_grade} percent={product.condition_percent} />
              {product.condition_note && <div className="text-muted-text mt-1">{product.condition_note}</div>}
            </div>
            <div>
              <div className="text-muted-text font-bold uppercase mb-1">Stok</div>
              <div className="font-bold text-base text-ink">{product.stock} unit</div>
            </div>
          </div>

          {/* Tipe Motor yang Cocok */}
          {product.motor_types?.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Tipe Motor yang Cocok
              </div>
              <div className="flex flex-wrap gap-2">
                {product.motor_types.map((mt) => (
                  <Badge key={mt.id} variant={mt.is_primary ? 'brand' : 'default'} size="sm">
                    {mt.name}
                  </Badge>
                ))}
              </div>
              {product.compat_notes && (
                <p className="text-xs text-muted-text mt-1.5 leading-relaxed">{product.compat_notes}</p>
              )}
            </div>
          )}

          {/* Peringatan Kecocokan Motor Saya */}
          {selectedMotor && compatStatus !== 'unknown' && (
            <div className={`p-3 border rounded-sm flex gap-3 items-start text-sm ${
              compatStatus === 'compatible'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-400 text-amber-900'
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${compatStatus === 'compatible' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <Bike className="w-4 h-4" />
                  Cek Kecocokan: {selectedMotor.name}
                </div>
                <p className="mt-0.5">{compatMessage}</p>
                {compatStatus === 'incompatible' && (
                  <div className="flex gap-2 mt-2">
                    <Link to="/" className="text-xs font-bold underline">Lihat yang cocok</Link>
                    <a href={buildWaUrl()} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline">
                      Tanya via WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deskripsi */}
          {product.description && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Deskripsi</div>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action Bar (Mobile) & Normal (Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto z-30 p-3 bg-white border-t border-neutral-200 lg:border-t-0 lg:p-0 lg:mt-6 lg:bg-transparent">
        <div className="max-w-7xl mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={handleShare}
            icon={Share2}
            className="flex-shrink-0"
          >
            Bagikan
          </Button>
          <a
            href={buildWaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold font-display uppercase tracking-wider bg-green-600 text-white hover:bg-green-700 border border-green-600 rounded-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <Button
            variant="primary"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            icon={ShoppingCart}
            className="flex-1"
          >
            {isAvailable ? 'Tambah ke Keranjang' : (product.status === 'sold' ? 'Terjual' : 'Tidak Tersedia')}
          </Button>
        </div>
      </div>

      {/* Spacer untuk mobile sticky bar */}
      <div className="h-20 lg:hidden" />

      {/* Produk Terkait */}
      {related.length > 0 && (
        <div className="mt-12">
          <div className="text-xs font-display uppercase tracking-widest font-bold text-brand mb-1">
            SERING DIBUTUHKAN BERSAMA
          </div>
          <h2 className="text-xl font-display font-extrabold uppercase text-ink mb-4">
            Produk Terkait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} myMotorSlug={selectedMotor?.slug} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && activeImage?.path && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={activeImage.path}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:text-brand"
          >
            <span className="text-2xl font-bold">✕</span>
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => Math.max(0, i - 1)); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white rounded-sm"
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => Math.min(images.length - 1, i + 1)); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white rounded-sm"
                disabled={activeImageIndex === images.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="space-y-4">
          <Skeleton className="w-24 h-5" />
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-1/2 h-8" />
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-full h-24" />
        </div>
      </div>
    </div>
  );
}

