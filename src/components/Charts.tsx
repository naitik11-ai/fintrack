import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { DashboardStats } from '../types';
import { formatCurrency } from '../lib/utils';

interface ChartsProps { stats: DashboardStats; }

const RADIAN = Math.PI / 180;

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function Tip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card py-2 px-3 text-xs shadow-2xl">
      <p className="font-semibold text-primary mb-1">{payload[0].name || payload[0].dataKey}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} style={{ color: e.color }}>
          {e.name || e.dataKey}: {formatCurrency(e.value)}
        </p>
      ))}
    </div>
  );
}

export default function Charts({ stats }: ChartsProps) {
  const hasData    = stats.categoryBreakdown.length > 0;
  const hasBarData = stats.dailySpending.some(d => d.amount > 0 || d.income > 0);
  // on mobile show last 7 days, on desktop 14 — Recharts can't know viewport, so
  // we always send 14 but the ResponsiveContainer width handles tick density
  const barData = stats.dailySpending.slice(-14);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Pie / Category breakdown ── */}
      <motion.div className="card"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-sm font-semibold text-primary mb-3">Category Breakdown</h3>

        {!hasData ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-muted-custom text-sm">No expense data yet</p>
          </div>
        ) : (
          <>
            {/* Chart — shorter on mobile */}
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.categoryBreakdown}
                  cx="50%" cy="50%"
                  outerRadius="80%" innerRadius="38%"
                  dataKey="amount" nameKey="category"
                  labelLine={false} label={PieLabel}
                >
                  {stats.categoryBreakdown.map((e, i) => (
                    <Cell key={i} fill={e.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend — 2-col grid on mobile, 1-col on narrower cards */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 max-h-32 overflow-y-auto pr-1">
              {stats.categoryBreakdown.slice(0, 8).map(cat => (
                <div key={cat.category} className="flex items-center justify-between text-xs min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: cat.color }} />
                    <span className="text-secondary truncate">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-muted-custom">{cat.percentage.toFixed(0)}%</span>
                    <span className="font-medium text-primary">{formatCurrency(cat.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Bar / Spending trends ── */}
      <motion.div className="card"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <h3 className="text-sm font-semibold text-primary mb-3">Spending Trends (Last 14 Days)</h3>

        {!hasBarData ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-muted-custom text-sm">No spending data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'hsl(var(--text-muted))' }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--text-muted))' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                width={40}
              />
              <Tooltip content={<Tip />} cursor={{ fill: 'hsl(var(--surface-2) / 0.5)' }} />
              <Bar dataKey="amount" name="Expense" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={20} fillOpacity={0.85} />
              <Bar dataKey="income" name="Income"  fill="#10b981" radius={[3,3,0,0]} maxBarSize={20} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {hasBarData && (
          <div className="flex items-center gap-4 mt-2 justify-center">
            {[{ color: '#ef4444', label: 'Expense' }, { color: '#10b981', label: 'Income' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-secondary">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
