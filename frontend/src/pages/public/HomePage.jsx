import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatRupiah } from '../../utils/format';
import { Search, ShoppingCart, Bike, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        setHealth(res?.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Eyebrow & Hero Title */}
      <div className="mb-8">
        <div className="text-xs font-display uppercase tracking-[0.2em] font-bold text-brand mb-1">
          KATALOG PART · KAWASAKI NINJA 2-TAK
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold uppercase font-display text-ink tracking-tight">
          CARI PART YANG TEPAT
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Gunakan kode produk saat menghubungi kami agar tidak tertukar.
        </p>
      </div>

      {/* Health status banner for Phase 1 verification */}
      <div className="border border-neutral-200 bg-neutral-50 p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider font-display text-ink">
              Fondasi Sistem & Koneksi API
            </span>
          </div>
          <p className="text-xs text-muted-text">
            {loading ? 'Memeriksa status server...' : health ? `Backend PHP ${health.php_version} & MariaDB ${health.database?.version || 'OK'} terhubung.` : 'Gagal terhubung ke API backend.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="available">Fase 1: Fondasi Selesai</Badge>
        </div>
      </div>

      {/* Grid Skeleton Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  );
}

