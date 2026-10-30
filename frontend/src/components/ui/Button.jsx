import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  icon: Icon,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-display uppercase tracking-wider font-bold transition-colors select-none focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs min-h-[36px]",
    md: "px-4 py-2.5 text-sm min-h-[44px]",
    lg: "px-6 py-3.5 text-base min-h-[48px]",
  }[size];

  const variantClasses = {
    primary: "bg-brand text-white hover:bg-brand-dark active:bg-brand-dark border border-brand",
    secondary: "bg-ink text-white hover:bg-ink-light border border-ink",
    outline: "bg-transparent text-ink border border-neutral-300 hover:border-brand hover:text-brand",
    outlineBrand: "bg-transparent text-brand border border-brand hover:bg-brand hover:text-white",
    ghost: "bg-transparent text-ink hover:bg-muted-bg",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
    success: "bg-status-availableBg text-status-availableText hover:bg-emerald-100 border border-emerald-300",
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${base}
        ${sizeClasses}
        ${variantClasses}
        ${fullWidth ? 'w-full' : ''}
        rounded-sm
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Memproses...
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children}
        </span>
      )}
    </button>
  );
}

