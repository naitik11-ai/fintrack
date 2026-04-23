import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useDashboardStats } from '../hooks/useTransactions';
import { formatCurrency } from '../lib/utils';
import Charts from '../components/Charts';
import TransactionForm from '../components/TransactionForm';
import { Transaction } from '../types';

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* ── Charts ── */}
      <Charts stats={stats} />

      {/* ── Recent Transactions ── */}
      {transactions.length > 0 && (
        <motion.div className="card"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">Recent Transactions</h3>
            <a href="/transactions" className="text-xs text-accent hover:underline shrink-0">View all →</a>
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
