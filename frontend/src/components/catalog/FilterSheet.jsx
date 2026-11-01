import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

const CONDITIONS = [
  { value: 'excellent', label: 'Mulus (Excellent)' },
  { value: 'good',      label: 'Bagus (Good)' },
  { value: 'fair',      label: 'Normal (Fair)' },
  { value: 'poor',      label: 'Minus (Poor)' },
];

const SORTS = [
  { value: 'default',    label: 'Tersedia Dulu, Terbaru' },
  { value: 'newest',     label: 'Terbaru' },
  { value: 'price_asc',  label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
];

const AVAILABILITY = [
  { value: '', label: 'Semua Status' },
  { value: 'available',   label: 'Tersedia' },
  { value: 'sold',        label: 'Terjual' },
  { value: 'unavailable', label: 'Tidak Tersedia' },
];

export default function FilterSheet({ filters, setFilters, motorTypes, onClose }) {
  const activeFilterCount = [
    filters.motor_type, filters.condition, filters.availability,
  ].filter(Boolean).length;

  const handleReset = () => {
    setFilters((prev) => ({
      ...prev,
      motor_type: '',
      condition: '',
      availability: '',
      sort: 'default',
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold uppercase text-lg text-ink">Filter Lanjutan</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-brand text-white text-xs font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-neutral-400 hover:text-ink">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scroll Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Tipe Motor */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
            Tipe Motor
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="motor_type"
                value=""
                checked={filters.motor_type === ''}
                onChange={() => setFilters((prev) => ({ ...prev, motor_type: '' }))}
                className="accent-brand"
              />
              <span className="text-sm">Semua Tipe Motor</span>
            </label>
            {motorTypes.map((mt) => (
              <label key={mt.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="motor_type"
                  value={mt.slug}
                  checked={filters.motor_type === mt.slug}
                  onChange={() => setFilters((prev) => ({ ...prev, motor_type: mt.slug }))}
                  className="accent-brand"
                />
                <span className="text-sm">{mt.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Kondisi */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
            Kondisi Part
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                value=""
                checked={filters.condition === ''}
                onChange={() => setFilters((prev) => ({ ...prev, condition: '' }))}
                className="accent-brand"
              />
              <span className="text-sm">Semua Kondisi</span>
            </label>
            {CONDITIONS.map((c) => (
              <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={c.value}
                  checked={filters.condition === c.value}
                  onChange={() => setFilters((prev) => ({ ...prev, condition: c.value }))}
                  className="accent-brand"
                />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ketersediaan */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
            Ketersediaan
          </div>
          <div className="space-y-2">
            {AVAILABILITY.map((a) => (
              <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value={a.value}
                  checked={filters.availability === a.value}
                  onChange={() => setFilters((prev) => ({ ...prev, availability: a.value }))}
                  className="accent-brand"
                />
                <span className="text-sm">{a.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Urutan */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
            Urutkan
          </div>
          <select
            className="w-full border border-neutral-300 rounded-sm p-2 text-sm focus:outline-none focus:border-brand"
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer Aksi */}
      <div className="px-4 py-3 border-t border-neutral-200 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={handleReset} icon={RotateCcw}>
          Reset
        </Button>
        <Button variant="primary" onClick={onClose}>
          Terapkan
        </Button>
      </div>
    </div>
  );
}

