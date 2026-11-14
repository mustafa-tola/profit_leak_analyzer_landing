import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'icon' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-[9px] text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-sm hover:bg-accent-hover',
  secondary:
    'border border-line bg-surface text-ink shadow-sm hover:bg-subtle',
  ghost:
    'text-muted hover:bg-subtle hover:text-ink',
  text:
    'px-3 py-2 text-accent-ink hover:bg-accent-soft/50',
  icon:
    'h-10 w-10 text-ink hover:bg-subtle',
  danger:
    'bg-danger text-white hover:bg-[#9E2B20]',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2.5',
  lg: 'px-5 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {props.children}
      {rightIcon ? rightIcon : null}
    </button>
  );
}
