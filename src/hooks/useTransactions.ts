import { useEffect, useState } from 'react';
import { subscribeToTransactions } from '../lib/firestore';
import { DashboardStats, Transaction, CategoryStats, CATEGORY_COLORS, Category } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subDays } from 'date-fns';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToTransactions(userId, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  return { transactions, loading };
}

export function useDashboardStats(
  transactions: Transaction[],
  monthlyBudget: number
): DashboardStats {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');

  const totalLifetimeSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const totalLifetimeIncome = income.reduce((s, t) => s + t.amount, 0);

  const spentThisMonth = thisMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const incomeThisMonth = thisMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const remainingBudget = monthlyBudget - spentThisMonth;
  const budgetUsedPercent = monthlyBudget > 0 ? Math.min((spentThisMonth / monthlyBudget) * 100, 100) : 0;

  // Category breakdown for this month's expenses
  const catMap: Record<string, number> = {};
  thisMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

  const categoryBreakdown: CategoryStats[] = Object.entries(catMap)
    .map(([category, amount]) => ({
      category: category as Category,
      amount,
      count: thisMonthTxs.filter((t) => t.category === category && t.type === 'expense').length,
      percentage: spentThisMonth > 0 ? (amount / spentThisMonth) * 100 : 0,
      color: CATEGORY_COLORS[category as Category] || '#94a3b8',
    }))
    .sort((a, b) => b.amount - a.amount);

  // Daily spending for last 30 days
  const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
  const dailySpending = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTxs = transactions.filter((t) => t.date === dateStr);
    return {
      date: format(day, 'MMM dd'),
      amount: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    };
  });

  return {
    totalLifetimeSpent,
    totalLifetimeIncome,
    spentThisMonth,
    incomeThisMonth,
    remainingBudget,
    budgetUsedPercent,
    categoryBreakdown,
    dailySpending,
    transactionCount: transactions.length,
  };
}
