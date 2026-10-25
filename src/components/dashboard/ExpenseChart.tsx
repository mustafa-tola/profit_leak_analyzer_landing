import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { monthlyExpenses } from '../../data/dashboard';

type ExpenseChartProps = {isDark: boolean;};

type TooltipEntry = {name?: string;value?: number;color?: string;};
type TooltipContentProps = {active?: boolean;payload?: TooltipEntry[];label?: string;};

export function ExpenseChart({ isDark }: ExpenseChartProps) {
  const c = isDark ?
  { forward: '#6B8DB5', returns: '#34D399', grid: '#223752', tick: '#9BABC0', cursor: 'rgba(255,255,255,0.04)' } :
  { forward: '#11243A', returns: '#047857', grid: '#E2E8F0', tick: '#526278', cursor: 'rgba(17,36,58,0.04)' };

  return (
    <section aria-label="Courier expenses by month" className="rounded-xl border border-line bg-surface p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-ink">Courier expenses by month</h3>
          <p className="mt-0.5 text-[12px] text-muted">Apr – Sep 2026 · PKR thousands</p>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-muted">
          <LegendDot color={c.forward} label="Forward freight" />
          <LegendDot color={c.returns} label="Return freight" />
        </div>
      </div>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyExpenses} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: c.tick, fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: c.tick, fontSize: 12 }}
              tickFormatter={(v: number) => `${v}k`} />
            
            <Tooltip
              cursor={{ fill: c.cursor }}
              content={(props) => renderTooltip(props as unknown as TooltipContentProps)} />
            
            <Bar dataKey="forward" name="Forward freight" stackId="cost" fill={c.forward} />
            <Bar dataKey="returns" name="Return freight" stackId="cost" fill={c.returns} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>);

}

function LegendDot({ color, label }: {color: string;label: string;}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>);

}

function renderTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[12px] shadow-soft">
      <p className="font-semibold text-ink">{label} 2026 · sample</p>
      {payload.map((p) =>
      <p key={p.name} className="mt-1 flex items-center justify-between gap-6 text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="tabular-nums text-ink">PKR {p.value?.toFixed(1)}k</span>
        </p>
      )}
      <p className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-medium text-ink">
        <span>Total</span>
        <span className="tabular-nums">PKR {total.toFixed(1)}k</span>
      </p>
    </div>);

}