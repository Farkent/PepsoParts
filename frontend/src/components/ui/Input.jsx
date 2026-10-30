import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  id,
  type = 'text',
  className = '',
  icon: Icon,
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-neutral-700 select-none">
          {label} {required && <span className="text-brand">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-neutral-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          required={required}
          className={`
            w-full
            ${Icon ? 'pl-9' : 'px-3'}
            py-2.5
            text-base sm:text-sm
            bg-white
            text-ink
            border
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-brand focus:ring-brand'}
            rounded-sm
            focus:outline-none
            focus:ring-1
            disabled:bg-neutral-100
            disabled:text-neutral-500
            placeholder:text-neutral-400
            ${className}
          `}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-xs text-red-600 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-text">{helperText}</span>
      ) : null}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  rows = 3,
  className = '',
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-neutral-700 select-none">
          {label} {required && <span className="text-brand">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        required={required}
        className={`
          w-full
          px-3
          py-2.5
          text-base sm:text-sm
          bg-white
          text-ink
          border
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-brand focus:ring-brand'}
          rounded-sm
          focus:outline-none
          focus:ring-1
          disabled:bg-neutral-100
          disabled:text-neutral-500
          placeholder:text-neutral-400
          ${className}
        `}
        {...props}
      />

      {error ? (
        <span className="text-xs text-red-600 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-text">{helperText}</span>
      ) : null}
    </div>
  );
}

