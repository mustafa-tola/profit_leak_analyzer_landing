import React from 'react';

type AlertVariant = 'info' | 'warn' | 'error' | 'success';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'border-accent/30 bg-accent-soft',
  warn: 'border-warn/30 bg-warn-soft',
  error: 'border-danger/30 bg-danger-soft',
  success: 'border-accent/30 bg-accent-soft',
};

const variantText: Record<AlertVariant, string> = {
  info: 'text-accent-ink',
  warn: 'text-warn',
  error: 'text-danger',
  success: 'text-accent-ink',
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  warn: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  error: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  success: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
};

export function Alert({
  variant = 'info',
  title,
  icon,
  className = '',
  children,
  ...props
}: AlertProps) {
  const textColor = variantText[variant];
  return (
    <div
      role="alert"
      aria-label={title}
      className={`flex items-start gap-3 rounded-[14px] border p-4 sm:px-5 text-sm ${variantStyles[variant]} ${textColor} ${className}`}
      {...props}
    >
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[${variant === 'warn' ? '#E7A65B' : variant === 'error' ? '#B42318' : '#0B1F44'}] bg-[${variant === 'warn' ? '#FFF4E5' : variant === 'error' ? '#FEF3F2' : '#E2E8F0'}] text-[${variant === 'warn' ? '#92400E' : variant === 'error' ? '#B42318' : '#0B1F44'}]`}>
        {icon ?? defaultIcons[variant]}
      </div>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
