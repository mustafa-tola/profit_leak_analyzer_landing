import { Link } from 'react-router-dom';

type LogoProps = { inverted?: boolean; };

const MARK_PATHS = [
  { d: 'M0 100 L37 43 H65 L28 100 Z', fill: '#0B1F44' },
  { d: 'M40 100 L83 24 H111 L68 100 Z', fill: '#14B8A6' },
  { d: 'M80 100 L137 0 H165 L108 100 Z', fill: '#10B981' },
];

export function Logo({ inverted = false }: LogoProps) {
  const textColor = inverted ? 'text-white' : 'text-ink';

  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Marginovia home">
      
      <LogoMark size={28} inverted={inverted} />
      <span
        className={`font-display font-bold tracking-tight whitespace-nowrap ${textColor} text-xl`}
      >
        marginovia
      </span>
    </Link>);
}

export function LogoMark({ size = 28, inverted = false }: {size?: number; inverted?: boolean}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 160"
      role="img"
      aria-label="Marginovia mark"
      className="shrink-0">
      <g transform="translate(27 30)">
        {MARK_PATHS.map((path, i) => (
          <path key={i} d={path.d} fill={inverted ? '#FFFFFF' : path.fill} />
        ))}
      </g>
    </svg>
  );
}
