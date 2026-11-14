import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  required = false,
  hint,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'input';
  return (
    <div className="block">
      {label && (
        <label
          htmlFor={inputId}
          className={`form-label ${required ? 'form-label-required' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`form-input ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        {...(error ? { 'aria-describedby': `${inputId}-error` } : {})}
        {...props}
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p id={`${inputId}-error`} className="form-error">{error}</p>}
    </div>
  );
}
