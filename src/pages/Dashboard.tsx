import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useDashboardStats } from '../hooks/useTransactions';
import { formatCurrency } from '../lib/utils';
import Charts from '../components/Charts';
import TransactionForm from '../components/TransactionForm';
import { Transaction } from '../types';
import { Link } from 'react-router-dom';

/* ── Stat card component ─────────────────────────── */
function StatCard({
  label, value, icon: Icon, color, sub, delay = 0,
}: {
  label: string; value: string; icon: React.ElementType;
  color: string; sub?: string; delay?: number;
}) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      whileHover={{ translateY: -2 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-muted-custom font-medium mb-1 truncate">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-primary font-display leading-tight">{value}</p>
          {sub && <p className="text-[10px] sm:text-xs text-muted-custom mt-1 truncate">{sub}</p>}
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, color }}>
          <Icon size={17} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Dashboard ───────────────────────────────────── */
export default function Dashboard() {
  const { transactions, profile } = useApp();
  const stats = useDashboardStats(transactions, profile.monthlyBudget);
  const [showForm, setShowForm] = useState(false);
  const [editTx,   setEditTx]   = useState<Transaction | null>(null);

  const isOverBudget  = stats.remainingBudget < 0;
  const budgetWarning = stats.budgetUsedPercent >= 80 && !isOverBudget;

  const monthlyNet = stats.incomeThisMonth - stats.spentThisMonth;
  const dayOfMonth = new Date().getDate();
  const dailyNet = dayOfMonth > 0 ? monthlyNet / dayOfMonth : 0;
  const predictionText = monthlyNet >= 0
    ? `If this pace continues, you will save ${formatCurrency(monthlyNet)} this month.`
    : `Spending exceeds income by ${formatCurrency(Math.abs(monthlyNet))} this month.`;

  const activeGoal = profile.savingsGoals?.slice().sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const goalRemaining = activeGoal ? Math.max(activeGoal.targetAmount - activeGoal.currentAmount, 0) : 0;
  const estimatedDays = dailyNet > 0 ? Math.ceil(goalRemaining / dailyNet) : null;
  const predictedCompletion = estimatedDays !== null
    ? new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)
    : null;
  const goalText = activeGoal
    ? goalRemaining <= 0
      ? `Goal “${activeGoal.title}” already reached!`
      : dailyNet > 0
        ? `At your current pace, “${activeGoal.title}” may be reached by ${predictedCompletion?.toLocaleDateString('en-IN')}.`
        : `Add more savings or income to reach “${activeGoal.title}”.`
    : 'Create a savings goal in Settings to track progress.';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-primary font-display leading-snug">
            Good {greeting}, {profile.displayName} 👋
          </h2>
          <p className="text-xs sm:text-sm text-muted-custom mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        {/* Add button — hidden: desktop uses sidebar btn, mobile uses header btn */}
        <button
          id="dashboard-add-btn"
          onClick={() => { setEditTx(null); setShowForm(true); }}
          className="btn-primary hidden xl:flex items-center gap-2 shrink-0"
        >
          <Plus size={15} /> Add Transaction
        </button>
      </div>



      {/* ── Stat cards ── */}
      {/* 2 col on mobile, 4 col on large desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Spent This Month"   value={formatCurrency(stats.spentThisMonth)}
          icon={TrendingDown} color="#ef4444"
          sub={`of ${formatCurrency(profile.monthlyBudget)} budget`} delay={0} />
        <StatCard label="Income This Month"  value={formatCurrency(stats.incomeThisMonth)}
          icon={TrendingUp}  color="#10b981"
          sub={`Total: ${formatCurrency(stats.totalLifetimeIncome)}`} delay={0.05} />
        <StatCard label="Remaining Budget"   value={formatCurrency(Math.abs(stats.remainingBudget))}
          icon={Target}
          color={isOverBudget ? '#ef4444' : budgetWarning ? '#f59e0b' : '#10b981'}
          sub={isOverBudget ? '⚠ Over budget' : `${stats.budgetUsedPercent.toFixed(0)}% used`}
          delay={0.08} />
        <StatCard label="Transactions"       value={String(stats.transactionCount)}
          icon={Wallet}      color="#6366f1"
          sub={`Lifetime spend: ${formatCurrency(stats.totalLifetimeSpent)}`} delay={0.11} />
      </div>

      {/* ── Budget progress ── */}
      <motion.div className="card"
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-primary">Monthly Budget</h3>
            {(isOverBudget || budgetWarning) && (
              <span className={`badge text-[10px] ${isOverBudget ? 'badge-red' : 'badge-yellow'}`}>
                <AlertTriangle size={9} />
                {isOverBudget ? 'Over Budget' : 'Near Limit'}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-custom whitespace-nowrap">
            {formatCurrency(stats.spentThisMonth)} / {formatCurrency(profile.monthlyBudget)}
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className={`progress-fill ${isOverBudget || budgetWarning ? 'progress-fill-danger' : ''}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.budgetUsedPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.25 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-custom">₹0</span>
          <span className="text-[10px] text-muted-custom">{formatCurrency(profile.monthlyBudget)}</span>
        </div>
      </motion.div>

      {/* ── Spending insights ── */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label="Daily average"
            value={formatCurrency(stats.dailyAverage)}
            icon={TrendingDown}
            color="#8b5cf6"
            sub={`Based on ${new Date().getDate()} days this month`}
            delay={0.02}
          />
          <StatCard
            label="Weekly trend"
            value={`${stats.weeklyComparison.percentChange.toFixed(0)}%`}
            icon={TrendingUp}
            color={stats.weeklyComparison.trend === 'up' ? '#ef4444' : '#10b981'}
            sub={stats.weeklyComparison.trend === 'flat'
              ? 'Stable week-over-week'
              : stats.weeklyComparison.trend === 'up'
                ? 'Spending increased' : 'Spending decreased'}
            delay={0.04}
          />
          <StatCard
            label="Monthly comparison"
            value={`${stats.monthlyComparison.percentChange.toFixed(0)}%`}
            icon={Target}
            color={stats.monthlyComparison.trend === 'up' ? '#ef4444' : '#10b981'}
            sub={stats.monthlyComparison.trend === 'up'
              ? 'Higher than last month'
              : stats.monthlyComparison.trend === 'down'
                ? 'Lower than last month' : 'Flat month-over-month'}
            delay={0.06}
          />
          <StatCard
            label="Top category"
            value={stats.categoryBreakdown[0]?.category || 'N/A'}
            icon={Wallet}
            color="#10b981"
            sub={stats.categoryBreakdown[0] ? `${stats.categoryBreakdown[0].percentage.toFixed(0)}% of spend` : 'No spend data'}
            delay={0.08}
          />
        </div>

        <motion.div className="card"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Smart insights</h3>
              <p className="text-xs text-muted-custom mt-1">Key spending patterns that matter this month.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              predictionText,
              goalText,
              stats.weekendTrend.insight,
              stats.lateNightSpending.insight,
              stats.subscriptionAlerts[0] || 'No obvious recurring subscriptions detected.',
            ].map((insight, index) => (
              <div key={index} className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm text-primary font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Charts stats={stats} />

      {/* ── Heatmap + category summary ── */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <motion.div className="card"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Spending heatmap</h3>
              <p className="text-xs text-muted-custom mt-1">Last 28 days — darker means more spend.</p>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-custom mb-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
              <div key={day} className="text-center font-semibold">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {stats.heatmap.map((cell) => (
              <div key={`${cell.date}-${cell.week}`}
                className="aspect-square rounded-2xl border border-transparent transition-all"
                style={{ background: `rgba(16,185,129, ${0.12 + cell.intensity * 0.7})` }}
                title={`${cell.date}: ₹${cell.amount.toFixed(0)}`}>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="card"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Top categories</h3>
              <p className="text-xs text-muted-custom mt-1">Where most of your money is going.</p>
            </div>
          </div>
          <div className="space-y-3">
            {stats.categoryBreakdown.slice(0, 3).map((cat) => (
              <div key={cat.category} className="rounded-2xl border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-primary truncate">{cat.category}</span>
                  <span className="text-sm font-semibold text-primary">{cat.percentage.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-custom">
                  <span>{formatCurrency(cat.amount)} spent</span>
                  <span>{cat.count} transactions</span>
                </div>
              </div>
            ))}
          </div>

          {stats.spikeDays.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-3">
              <p className="text-sm font-semibold text-primary mb-2">Spending spikes</p>
              {stats.spikeDays.slice(0, 2).map((spike) => (
                <div key={spike.date} className="text-sm text-muted-custom mb-2">
                  <span className="font-medium text-primary">{spike.date}</span> — ₹{spike.amount.toFixed(0)}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Recent Transactions ── */}
      {transactions.length > 0 && (
        <motion.div className="card"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-accent hover:underline shrink-0">View all →</Link>
          </div>
          <div className="space-y-1">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${tx.type === 'income' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                  {tx.type === 'income'
                    ? <TrendingUp size={14}   className="text-green-400" />
                    : <TrendingDown size={14} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{tx.description}</p>
                  <p className="text-xs text-muted-custom truncate">{tx.category} · {tx.date}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {transactions.length === 0 && (
        <motion.div className="card text-center py-12 sm:py-16"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Wallet size={26} className="text-accent" />
          </div>
          <p className="text-base font-semibold text-primary mb-1">No transactions yet</p>
          <p className="text-sm text-muted-custom mb-5 max-w-xs mx-auto">
            Add your first transaction to start tracking your finances
          </p>
          <button onClick={() => setShowForm(true)}
            className="btn-primary mx-auto inline-flex items-center gap-2">
            <Plus size={15} /> Add First Transaction
          </button>
        </motion.div>
      )}

      {/* Form modal */}
      {showForm && (
        <TransactionForm
          editTransaction={editTx}
          onClose={() => { setShowForm(false); setEditTx(null); }}
        />
      )}
    </div>
  );
}
