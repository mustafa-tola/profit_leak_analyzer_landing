import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export function Select({
  label,
  required = false,
  hint,
  error,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'select';
  return (
    <div className="block">
      {label && (
        <label
          htmlFor={selectId}
          className={`form-label ${required ? 'form-label-required' : ''}`}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`form-select ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        {...(error ? { 'aria-describedby': `${selectId}-error` } : {})}
        {...props}
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p id={`${selectId}-error`} className="form-error">{error}</p>}
    </div>
  );
}
