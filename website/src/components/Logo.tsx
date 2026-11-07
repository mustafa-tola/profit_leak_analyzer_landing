import { Link } from 'react-router-dom';

type LogoProps = {inverted?: boolean;};

export function Logo({ inverted = false }: LogoProps) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Profit Leak Analyzer home">
      
      <LogoMark />
      <span
        className={`whitespace-nowrap text-[15px] font-semibold tracking-tight ${
        inverted ? 'text-white' : 'text-ink'}`
        }>
        
        Profit Leak Analyzer
      </span>
    </Link>);

}

export function LogoMark({ size = 28 }: {size?: number;}) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
      <rect width="28" height="28" rx="7" className="fill-navy dark:fill-[#1B3553]" />
      <path
        d="M6 9.5 L11.5 15 L15.5 11 L21.5 17"
        fill="none"
        stroke="#34D399"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round" />
      
      <circle cx="21.5" cy="21.6" r="1.7" fill="#34D399" />
    </svg>);

}