import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { monthlyExpenses as sampleExpenses, type MonthlyExpense } from '../../data/dashboard';

type ExpenseChartProps = {
  isDark: boolean;
  data?: MonthlyExpense[];
  label?: string;
  sampleLabel?: string;
};

type TooltipEntry = { name?: string; value?: number; color?: string };
type TooltipContentProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

export function ExpenseChart({
  isDark,
  data = sampleExpenses,
  label = 'Apr – Sep 2026 · PKR thousands',
  sampleLabel = 'sample',
}: ExpenseChartProps) {
  const c = isDark
    ? { forward: '#10B981', returns: '#14B8A6', grid: '#1F2A44', tick: '#94A3B8', cursor: 'rgba(255,255,255,0.04)' }
    : { forward: '#0B1F44', returns: '#10B981', grid: '#CBD5E1', tick: '#64748B', cursor: 'rgba(11,31,68,0.05)' };

  return (
    <section aria-labelledby="expenses-heading" className="min-w-0 rounded-[14px] border border-line bg-surface p-4 shadow-sm sm:p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id="expenses-heading" className="font-display text-base font-semibold text-ink">Courier expenses by month</h3>
          <p className="mt-0.5 text-sm text-muted">{label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted">
          <LegendDot color={c.forward} label="Forward freight" />
          <LegendDot color={c.returns} label="Return freight" />
        </div>
      </div>
      <div className="mt-4 h-56 min-h-[14rem] w-full min-w-0 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="28%" margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: c.tick, fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: c.tick, fontSize: 12 }}
              tickFormatter={(v: number) => `${v}k`}
            />
            <Tooltip
              cursor={{ fill: c.cursor }}
              content={(props) => renderTooltip(props as unknown as TooltipContentProps, sampleLabel)}
            />
            <Bar dataKey="forward" name="Forward freight" stackId="cost" fill={c.forward} radius={[0, 0, 0, 0]} />
            <Bar dataKey="returns" name="Return freight" stackId="cost" fill={c.returns} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function renderTooltip({ active, payload, label }: TooltipContentProps, sampleLabel: string) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3 text-xs shadow-lift">
      <p className="font-semibold text-ink">{label}{sampleLabel ? ` · ${sampleLabel}` : ''}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1.5 flex items-center justify-between gap-6 text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} aria-hidden="true" />
            {p.name}
          </span>
          <span className="tabular-nums text-ink">PKR {p.value?.toFixed(1)}k</span>
        </p>
      ))}
      <p className="mt-2 flex justify-between border-t border-line pt-2 font-medium text-ink">
        <span>Total</span>
        <span className="tabular-nums">PKR {total.toFixed(1)}k</span>
      </p>
    </div>
  );
}
