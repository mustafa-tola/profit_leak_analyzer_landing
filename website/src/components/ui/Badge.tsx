import React from 'react';

type BadgeVariant = 'clean' | 'partial' | 'error' | 'neutral' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  clean: 'border-accent/30 bg-accent-soft text-accent-ink',
  partial: 'border-warn/30 bg-warn-soft text-warn',
  error: 'border-danger/30 bg-danger-soft text-danger',
  neutral: 'border-line bg-subtle text-muted',
  info: 'border-accent/30 bg-accent-soft text-accent-ink',
};

export function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
