import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Share2, MessageCircle } from 'lucide-react';
import Badge, { StatusBadge, GradeBadge } from '../ui/Badge';
import Button from '../ui/Button';
import { formatRupiah } from '../../utils/format';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product, myMotorSlug }) {
  const { addItem } = useCart();
  const isAvailable = product.status === 'available' && product.stock > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const primaryImage = product.primary_thumb || product.primary_image;

  // Kecocokan motor sederhana (deterministik dari data DB)
  let motorCompatClass = '';
  if (myMotorSlug && product.motor_type_slugs) {
    const slugs = product.motor_type_slugs.split(',');
    if (!slugs.includes(myMotorSlug)) {
      motorCompatClass = 'border-amber-400';
    }
  }

  return (
    <Link
      to={`/produk/${product.slug}`}
      className={`group relative flex flex-col bg-white border hover:border-brand transition-colors duration-150 overflow-hidden rounded-sm ${motorCompatClass || 'border-neutral-200'}`}
    >
      {/* Gambar Produk */}
      <div className={`relative aspect-[4/3] overflow-hidden bg-muted-bg ${!isAvailable ? 'grayscale opacity-70' : ''}`}>
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-text p-4">
            <div className="text-4xl mb-1">🔧</div>
            <span className="text-[10px] uppercase text-center font-display font-bold">{product.category_name}</span>
          </div>
        )}

        {/* Badge Ketersediaan - Kiri Atas */}
        <div className="absolute top-2 left-2">
          <StatusBadge status={product.status} stock={product.stock} />
        </div>

        {/* Badge Kategori - Kanan Atas */}
        <div className="absolute top-2 right-2">
          <Badge variant="brandLight" size="sm">{product.category_name}</Badge>
        </div>
      </div>

      {/* Info Produk */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Tipe Motor */}
        {product.motor_types_text && (
          <div className="text-[10px] text-muted-text font-semibold uppercase tracking-wider truncate">
            {product.motor_types_text}
          </div>
        )}

        {/* Nama Produk */}
        <div className="font-bold text-sm text-ink leading-tight line-clamp-2">
          {product.name}
        </div>

        {/* Kode Produk - Brand Orange */}
        <div className="text-xs font-bold font-display uppercase tracking-wider text-brand">
          {product.code}
        </div>

        {/* Kondisi */}
        <GradeBadge grade={product.condition_grade} percent={product.condition_percent} />

        {/* Harga & Aksi */}
        <div className="mt-auto pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div className="font-display font-extrabold text-base text-ink">
            {formatRupiah(product.price)}
          </div>

          {isAvailable ? (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-brand text-white text-xs font-bold font-display uppercase rounded-sm hover:bg-brand-dark transition-colors min-h-[36px]"
              aria-label="Tambah ke keranjang"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Pesan</span>
            </button>
          ) : (
            <span className="text-xs text-muted-text font-display font-bold uppercase">
              {product.status === 'sold' ? 'Terjual' : 'N/A'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

