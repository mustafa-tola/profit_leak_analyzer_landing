interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

export function Logo({ size = 'md', inverted = false }: LogoProps) {
  const sizeStyles: Record<'sm' | 'md' | 'lg', { mark: string; text: string }> = {
    sm: { mark: 'w-8 h-8', text: 'text-lg' },
    md: { mark: 'w-10 h-10', text: 'text-xl' },
    lg: { mark: 'w-12 h-12', text: 'text-2xl' },
  };

  const textColor = inverted ? 'text-[#F5F8F7]' : 'text-ink';

  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={sizeStyles[size].mark === 'w-12 h-12' ? 40 : sizeStyles[size].mark === 'w-10 h-10' ? 32 : 24}
        height={sizeStyles[size].mark === 'w-12 h-12' ? 40 : sizeStyles[size].mark === 'w-10 h-10' ? 32 : 24}
        viewBox="0 0 68 68"
        role="img"
        aria-label="Codvera mark"
        className={`shrink-0 ${sizeStyles[size].mark}`}
      >
        <path d="M43 16H27c-4 0-7 2-10 5L8 30c-3 3-3 8 0 11l9 9c3 3 8 3 11 0l8-8" fill="none" stroke="#087F62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 47l10 10c3 3 8 3 11 0l15-17" fill="none" stroke="#103E36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-display font-bold tracking-tight whitespace-nowrap ${textColor} ${sizeStyles[size].text}`}>
        codvera
      </span>
    </div>
  );
}
