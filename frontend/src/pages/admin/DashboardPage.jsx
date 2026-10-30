import React from 'react';
import Badge from '../../components/ui/Badge';
import { Package, CheckCircle2, ShoppingBag, Bell } from 'lucide-react';

export default function DashboardPage() {
  const statCards = [
    { title: 'Total Produk', value: '14', note: '+8 bulan ini', icon: Package, color: 'text-brand' },
    { title: 'Produk Tersedia', value: '12', note: '85% dari total', icon: CheckCircle2, color: 'text-emerald-600' },
    { title: 'Produk Terjual', value: '2', note: '15% dari total', icon: ShoppingBag, color: 'text-neutral-600' },
    { title: 'Pesanan Baru', value: '0', note: 'Perlu konfirmasi', icon: Bell, color: 'text-brand-dark' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
          OVERVIEW
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
          Dashboard Ringkasan
        </h1>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white border border-neutral-200 p-4 rounded-sm shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-text">
                  {card.title}
                </span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <div className="text-3xl font-display font-extrabold text-ink">{card.value}</div>
                <div className="text-[11px] text-muted-text mt-1">{card.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-white border border-neutral-200 p-5 rounded-sm">
        <h3 className="font-display font-bold uppercase text-lg text-ink mb-2">
          Status Proyek & Fondasi
        </h3>
        <p className="text-xs text-muted-text leading-relaxed">
          Struktur fondasi backend PHP 8.2 dan frontend React + Tailwind berhasil diinisialisasi.
          Database MySQL telah terimpor dengan 14 produk sample Kawasaki Ninja 2-Tak.
        </p>
      </div>
    </div>
  );
}

