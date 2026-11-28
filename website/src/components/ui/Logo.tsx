interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

const MARK_PATHS = [
  { d: 'M0 100 L37 43 H65 L28 100 Z', fill: '#0B1F44' },
  { d: 'M40 100 L83 24 H111 L68 100 Z', fill: '#14B8A6' },
  { d: 'M80 100 L137 0 H165 L108 100 Z', fill: '#10B981' },
];

const sizeStyles: Record<'sm' | 'md' | 'lg', { mark: string; text: string; svg: number }> = {
  sm: { mark: 'w-8 h-8', text: 'text-lg', svg: 24 },
  md: { mark: 'w-10 h-10', text: 'text-xl', svg: 32 },
  lg: { mark: 'w-12 h-12', text: 'text-2xl', svg: 40 },
};

export function Logo({ size = 'md', inverted = false }: LogoProps) {
  const styles = sizeStyles[size];
  const textColor = inverted ? 'text-white' : 'text-ink';

  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={styles.svg}
        height={styles.svg}
        viewBox="0 0 220 160"
        role="img"
        aria-label="Marginovia mark"
        className={`shrink-0 ${styles.mark}`}>
        <g transform="translate(27 30)">
          {MARK_PATHS.map((path, i) => (
            <path key={i} d={path.d} fill={inverted ? '#FFFFFF' : path.fill} />
          ))}
        </g>
      </svg>
      <span className={`font-display font-bold tracking-tight whitespace-nowrap ${textColor} ${styles.text}`}>
        marginovia
      </span>
    </div>
  );
}
