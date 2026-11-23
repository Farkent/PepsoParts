import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Copy, Check, Share2, MessageCircle, ShoppingCart,
  ChevronLeft, ChevronRight, AlertTriangle, Bike, ZoomIn,
  Sparkles, Bot, X
} from 'lucide-react';
import { getProduct, getRelatedProducts } from '../../api/endpoints';
import { useCart } from '../../context/CartContext';
import { useMotor } from '../../context/MotorContext';
import { useToast } from '../../context/ToastContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { formatRupiah, buildWhatsAppUrl } from '../../utils/format';
import Badge, { StatusBadge, GradeBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ProductCard from '../../components/catalog/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { customer } = useCustomerAuth();
  const { selectedMotor, motorTypes, selectMotor } = useMotor();
  const { success, error: showError } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [waSettings, setWaSettings] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'cart' | 'wa'
  const touchStartX = useRef(null);
  const didSwipe = useRef(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setProduct(null);
    setActiveImageIndex(0);
    setSelectedVariantId(null);
    setPickerOpen(false);

    getProduct(slug)
      .then((res) => {
        if (!mounted) return;
        if (!res?.data) { navigate('/404', { replace: true }); return; }
        setProduct(res.data);
        // Produk dengan satu varian: langsung terpilih
        if (res.data.variants?.length === 1) {
          const only = res.data.variants[0];
          setSelectedVariantId(only.id);
          const at = (res.data.images || []).findIndex((im) => Number(im.id) === Number(only.image_id));
          if (at >= 0) setActiveImageIndex(at);
        }

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
    const text = `${product.name} (${product.code}) - ${(product.variants?.length || 0) > 1 ? 'mulai ' : ''}${formatRupiah(product.price)} | PEPSO PARTS`;

    if (navigator.share) {
      navigator.share({ title: text, url });
    } else {
      navigator.clipboard.writeText(url);
      success('Tautan produk disalin ke clipboard!');
    }
  };

  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants ? variants.find((v) => v.id === selectedVariantId) || null : null;

  const doAddToCart = (variant) => {
    const ok = addItem(product, 1, variant);
    if (ok) {
      success(`${product.name}${variant ? ` (${variant.name})` : ''} ditambahkan ke keranjang.`);
      if (!customer) navigate('/akun', { state: { from: '/keranjang' } });
    }
  };

  const buildWaUrl = (variant = selectedVariant) => {
    if (!product || !waSettings) return '#';
    const appUrl = window.location.origin;
    const price = variant ? variant.price : product.price;
    const variantLine = variant ? `\nVarian: ${variant.name}` : '';
    const msg = `Halo PEPSO PARTS, saya tertarik dengan:\n${product.name} (Kode: ${product.code})${variantLine}\nHarga: ${formatRupiah(price)}\nMotor: ${product.motor_types_text || '-'}\nLink: ${appUrl}/produk/${product.slug}`;
    return buildWhatsAppUrl(waSettings, msg);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (hasVariants && !selectedVariant) {
      setPendingAction('cart');
      setPickerOpen(true);
      return;
    }
    doAddToCart(selectedVariant);
  };

  const handleWhatsApp = (e) => {
    if (hasVariants && !selectedVariant) {
      e.preventDefault();
      setPendingAction('wa');
      setPickerOpen(true);
    }
  };

  // Pilih varian: foto di galeri otomatis pindah ke foto varian tersebut
  const chooseVariant = (variant) => {
    setSelectedVariantId(variant.id);
    const at = variant.image_id ? (product?.images || []).findIndex((im) => Number(im.id) === Number(variant.image_id)) : -1;
    if (at >= 0) setActiveImageIndex(at);
  };

  const variantImage = (variant) =>
    variant?.image_id ? (product?.images || []).find((im) => Number(im.id) === Number(variant.image_id)) : null;

  // Geser foto di HP (kiri / kanan)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  };
  const handleTouchEnd = (e, total) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40 || total < 2) return;
    didSwipe.current = true;
    setActiveImageIndex((i) => (dx < 0 ? Math.min(total - 1, i + 1) : Math.max(0, i - 1)));
  };

  // Pelanggan memilih varian dari popup, lalu aksi yang tertunda dilanjutkan
  const handlePickVariant = (variant) => {
    chooseVariant(variant);
    setPickerOpen(false);
    if (pendingAction === 'cart') {
      doAddToCart(variant);
    } else if (pendingAction === 'wa') {
      window.open(buildWaUrl(variant), '_blank', 'noopener,noreferrer');
    }
    setPendingAction(null);
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  const images = product.images?.length ? product.images : [{ path: product.primary_image, thumb_path: product.primary_thumb, id: 0 }];
  const activeImage = images[activeImageIndex];

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isAvailable = product.status === 'available' && product.stock > 0 && (!selectedVariant || selectedVariant.stock > 0);

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
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, images.length)}
            onClick={() => {
              if (didSwipe.current) { didSwipe.current = false; return; }
              setLightboxOpen(true);
            }}
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

            {/* Penanda jumlah foto (geser untuk melihat foto lain) */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === activeImageIndex ? 'bg-brand' : 'bg-black/30'}`}
                  />
                ))}
              </div>
            )}

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
            {variants.length > 1 && !selectedVariant && (
              <span className="text-sm font-bold text-muted-text uppercase mr-2">Mulai dari</span>
            )}
            {formatRupiah(selectedVariant ? selectedVariant.price : product.price)}
          </div>

          {/* Pilihan Varian */}
          {hasVariants && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Pilihan
              </div>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = v.id === selectedVariantId;
                  const empty = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={empty}
                      onClick={() => chooseVariant(v)}
                      className={`flex items-center gap-2 px-2.5 py-2 border rounded-sm text-left transition-colors ${
                        active
                          ? 'border-brand bg-brand-light ring-1 ring-brand'
                          : 'border-neutral-300 bg-white hover:border-brand'
                      } ${empty ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      {variantImage(v) && (
                        <img
                          src={variantImage(v).thumb_path || variantImage(v).path}
                          alt=""
                          className="w-10 h-10 object-cover rounded-sm flex-shrink-0"
                        />
                      )}
                      <span>
                        <span className="block text-sm font-bold text-ink">{v.name}</span>
                        <span className="block text-xs text-muted-text">
                          {formatRupiah(v.price)}{empty ? ' · Habis' : ''}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {!selectedVariant && (
                <p className="text-[11px] text-muted-text mt-1.5">Pilih salah satu sebelum memesan.</p>
              )}
            </div>
          )}

          {/* Kondisi & Stok */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted-bg border border-neutral-200 rounded-sm text-xs">
            <div>
              <div className="text-muted-text font-bold uppercase mb-1">Kondisi</div>
              <GradeBadge grade={product.condition_grade} percent={product.condition_percent} />
              {product.condition_note && <div className="text-muted-text mt-1">{product.condition_note}</div>}
            </div>
            <div>
              <div className="text-muted-text font-bold uppercase mb-1">Stok</div>
              <div className="font-bold text-base text-ink">
                {hasVariants && !selectedVariant ? 'Pilih varian' : `${currentStock} unit`}
              </div>
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

          {/* Peringatan Kecocokan Motor Saya (Ditenagai AI) */}
          {selectedMotor && compatStatus !== 'unknown' ? (
            <div className={`p-3.5 border rounded-sm flex gap-3 items-start text-sm ${
              compatStatus === 'compatible'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-400 text-amber-900'
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${compatStatus === 'compatible' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-brand" />
                    <span>Cek Kecocokan: {selectedMotor.name}</span>
                  </div>
                  <span className="text-[10px] bg-white/80 border border-neutral-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase text-brand flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-brand" /> AI Verified
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed">{compatMessage}</p>
                <div className="flex flex-wrap gap-2 mt-2 pt-1 border-t border-black/5">
                  {compatStatus === 'incompatible' && (
                    <Link to="/" className="text-xs font-bold underline text-ink hover:text-brand">Lihat part lain yang cocok</Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('pepso:open-chat', {
                        detail: { prompt: `Apakah ${product.name} (${product.code}) cocok dipasang di ${selectedMotor.name}? Apa ada penyesuaian braket atau dudukan?` }
                      }));
                    }}
                    className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Konsultasi teknis dengan Pexo AI
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 border border-neutral-200 bg-neutral-50 rounded-sm text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-brand" />
                  Cek Kecocokan dengan Motor Anda:
                </span>
                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-brand" />
                  AI Compatibility
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {motorTypes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMotor(m)}
                    className="px-2.5 py-1 bg-white border border-neutral-300 hover:border-brand hover:text-brand text-ink text-[11px] rounded-sm transition-colors font-medium shadow-2xs"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                <p className="text-[10px] text-muted-text">
                  Pilih motormu untuk langsung verifikasi apakah part ini Plug & Play (PNP).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('pepso:open-chat', {
                      detail: { prompt: `Tanya detail dan kondisi fisik untuk ${product.name} (${product.code}) dong Pexo` }
                    }));
                  }}
                  className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1 ml-2 flex-shrink-0"
                >
                  <Bot className="w-3 h-3" />
                  Tanya AI
                </button>
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
            onClick={handleWhatsApp}
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

      {/* Popup pilih varian */}
      {pickerOpen && hasVariants && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => { setPickerOpen(false); setPendingAction(null); }}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-md sm:rounded-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-display font-extrabold uppercase text-lg text-ink">Pilih Varian</h3>
              <button
                type="button"
                onClick={() => { setPickerOpen(false); setPendingAction(null); }}
                className="p-1 text-neutral-500 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-text mb-4">
              {product.name} tersedia dalam beberapa pilihan. Silakan pilih yang kamu butuhkan.
            </p>
            <div className="space-y-2">
              {variants.map((v) => {
                const empty = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={empty}
                    onClick={() => handlePickVariant(v)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 border rounded-sm text-left transition-colors ${
                      empty
                        ? 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                        : 'border-neutral-300 hover:border-brand hover:bg-brand-light'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {variantImage(v) && (
                        <img
                          src={variantImage(v).thumb_path || variantImage(v).path}
                          alt=""
                          className="w-12 h-12 object-cover rounded-sm flex-shrink-0"
                        />
                      )}
                      <span>
                        <span className="block font-bold text-ink text-sm">{v.name}</span>
                        <span className="block text-xs text-muted-text">
                          {empty ? 'Stok habis' : `Stok ${v.stock}`}
                        </span>
                      </span>
                    </span>
                    <span className="font-display font-extrabold text-brand whitespace-nowrap">
                      {formatRupiah(v.price)}
                    </span>
                  </button>
                );
              })}
            </div>
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

