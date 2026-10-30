import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  }[size];

  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    brand: 'bg-brand text-white border-brand',
    brandLight: 'bg-orange-50 text-brand border-orange-200 font-semibold',
    
    // Status Ketersediaan (Sesuai Design Tokens Bagian 8)
    available: 'bg-status-availableBg text-status-availableText border-emerald-200 font-bold',
    sold: 'bg-status-soldBg text-status-soldText border-neutral-800 font-bold',
    unavailable: 'bg-neutral-200 text-neutral-700 border-neutral-300 font-bold',

    // Kondisi Grade
    gradeExcellent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    gradeGood: 'bg-blue-50 text-blue-800 border-blue-200',
    gradeFair: 'bg-amber-50 text-amber-800 border-amber-200',
    gradePoor: 'bg-red-50 text-red-800 border-red-200',

    // Motor compatibility
    compatible: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
    incompatible: 'bg-red-100 text-red-900 border-red-300 font-semibold',
    unknown: 'bg-neutral-100 text-neutral-800 border-neutral-300',
  }[variant] || 'bg-neutral-100 text-neutral-800 border-neutral-200';

  return (
    <span
      className={`
        inline-flex items-center uppercase tracking-wider font-display border rounded-sm select-none
        ${sizeClasses}
        ${variantClasses}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, stock = 1 }) {
  if (status === 'sold' || stock <= 0) {
    return <Badge variant="sold">TERJUAL</Badge>;
  }
  if (status === 'unavailable') {
    return <Badge variant="unavailable">TIDAK TERSEDIA</Badge>;
  }
  return <Badge variant="available">TERSEDIA</Badge>;
}

export function GradeBadge({ grade, percent }) {
  const map = {
    excellent: { label: 'Mulus', variant: 'gradeExcellent' },
    good: { label: 'Bagus', variant: 'gradeGood' },
    fair: { label: 'Normal', variant: 'gradeFair' },
    poor: { label: 'Minus', variant: 'gradePoor' },
  }[grade] || { label: grade, variant: 'default' };

  return (
    <Badge variant={map.variant}>
      {map.label} {percent ? `• ${percent}%` : ''}
    </Badge>
  );
}

