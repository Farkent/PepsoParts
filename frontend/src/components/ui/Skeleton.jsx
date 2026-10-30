import React from 'react';

export default function Skeleton({ className = '', rounded = 'rounded-sm' }) {
  return (
    <div
      className={`animate-pulse bg-neutral-200 ${rounded} ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-neutral-200 bg-white p-3 flex flex-col gap-3">
      {/* 4:3 Image ratio */}
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="flex justify-between items-center">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-full h-5" />
      <Skeleton className="w-3/4 h-5" />
      <div className="pt-2 border-t border-neutral-100 flex justify-between items-center">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-20 h-8" />
      </div>
    </div>
  );
}

