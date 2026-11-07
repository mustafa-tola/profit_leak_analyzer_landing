type SampleBadgeProps = {label?: string;onDark?: boolean;};

export function SampleBadge({ label = 'Sample data', onDark = false }: SampleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
      onDark ?
      'border border-white/20 bg-white/10 text-white' :
      'border border-warn/30 bg-warn-soft text-warn'}`
      }>
      
      <span
        className={`h-1.5 w-1.5 rounded-full ${onDark ? 'bg-amber-300' : 'bg-warn'}`}
        aria-hidden="true" />
      
      {label}
    </span>);

}