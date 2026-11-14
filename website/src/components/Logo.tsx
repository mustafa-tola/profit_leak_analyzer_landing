import { Link } from 'react-router-dom';

type LogoProps = {inverted?: boolean;};

export function Logo({ inverted = false }: LogoProps) {
  const textColor = inverted ? 'text-[#F5F8F7]' : 'text-ink';

  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Codvera home">
      
      <LogoMark />
      <span
        className={`font-display font-bold tracking-tight whitespace-nowrap ${textColor} text-xl`}
      >
        codvera
      </span>
    </Link>);
}

export function LogoMark({ size = 28 }: {size?: number;}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 68 68"
      role="img"
      aria-label="Codvera mark"
      className="shrink-0">
      <path d="M43 16H27c-4 0-7 2-10 5L8 30c-3 3-3 8 0 11l9 9c3 3 8 3 11 0l8-8" fill="none" stroke="#087F62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 47l10 10c3 3 8 3 11 0l15-17" fill="none" stroke="#103E36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);
}
