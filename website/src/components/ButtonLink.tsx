import React from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'onDark';

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-sm hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-subtle',
  onDark: 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
};

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  onClick
}: ButtonLinkProps) {
  const className = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] font-semibold transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-60 ${
  size === 'lg' ? 'h-11 px-4 py-3 text-sm font-semibold' : 'h-10 px-3 py-2.5 text-sm font-semibold'} ${
  fullWidth ? 'w-full' : ''} ${variantClasses[variant]}`;

  if (href.startsWith('/')) {
    return (
      <Link to={href} onClick={onClick} className={className}>
        {children}
      </Link>);

  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>);

}