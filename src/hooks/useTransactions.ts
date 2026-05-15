import { useEffect, useState } from 'react';
import { subscribeToTransactions } from '../lib/firestore';
import { DashboardStats, Transaction, CategoryStats, CATEGORY_COLORS, Category } from '../types';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  subDays, startOfWeek, subMonths,
} from 'date-fns';

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

  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subDays(currentWeekStart, 7);
  const lastWeekEnd = subDays(currentWeekStart, 1);
  const prevWeekStart = subDays(currentWeekStart, 14);
  const prevWeekEnd = subDays(currentWeekStart, 8);

  const weekTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= lastWeekStart && d <= lastWeekEnd;
  });
  const prevWeekTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= prevWeekStart && d <= prevWeekEnd;
  });

  const lastWeekSpent = weekTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevWeekSpent = prevWeekTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const weeklyChange = prevWeekSpent > 0 ? ((lastWeekSpent - prevWeekSpent) / prevWeekSpent) * 100 : 0;

  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(previousMonthStart);
  const lastMonthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= previousMonthStart && d <= previousMonthEnd;
  });
  const lastMonthSpent = lastMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthlyChange = lastMonthSpent > 0 ? ((spentThisMonth - lastMonthSpent) / lastMonthSpent) * 100 : 0;

  const dayOfMonth = now.getDate();
  const dailyAverage = dayOfMonth > 0 ? spentThisMonth / dayOfMonth : 0;

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekdaysCount = monthDays.filter((day) => [1, 2, 3, 4, 5].includes(day.getDay())).length;
  const weekendDaysCount = monthDays.filter((day) => [0, 6].includes(day.getDay())).length;
  const weekdaySpend = thisMonthTxs
    .filter((t) => t.type === 'expense')
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return [1, 2, 3, 4, 5].includes(day);
    })
    .reduce((s, t) => s + t.amount, 0);
  const weekendSpend = thisMonthTxs
    .filter((t) => t.type === 'expense')
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return [0, 6].includes(day);
    })
    .reduce((s, t) => s + t.amount, 0);
  const weekendAvg = weekendDaysCount > 0 ? weekendSpend / weekendDaysCount : 0;
  const weekdayAvg = weekdaysCount > 0 ? weekdaySpend / weekdaysCount : 0;

  const weekendTrend: DashboardStats['weekendTrend'] = {
    weekendAvg,
    weekdayAvg,
    ratio: weekdayAvg > 0 ? weekendAvg / weekdayAvg : weekendAvg > 0 ? 1 : 0,
    insight: weekendAvg > weekdayAvg * 1.15
      ? 'Weekend spending is higher than weekdays.'
      : 'Weekday and weekend spending are balanced.'
  };

  const lateNightTxs = thisMonthTxs.filter((t) => {
    if (t.type !== 'expense') return false;
    const hour = new Date(t.createdAt).getHours();
    return hour >= 20 || hour < 5;
  });
  const lateNightSpending = {
    count: lateNightTxs.length,
    total: lateNightTxs.reduce((s, t) => s + t.amount, 0),
    insight: lateNightTxs.length >= 3
      ? 'Late-night spending is frequent.'
      : 'Late-night spending is low right now.',
  };

  const averageDailySpend = spentThisMonth / (dayOfMonth || 1);
  const spikeDays = dailySpending
    .filter((day) => day.amount > averageDailySpend * 1.6 && day.amount > 300)
    .map((day) => ({ date: day.date, amount: day.amount, note: 'Spending spiked compared to average.' }));

  const expenseGroups = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, Transaction[]>>((acc, tx) => {
      const key = tx.description.toLowerCase().trim();
      if (!key) return acc;
      acc[key] = [...(acc[key] || []), tx];
      return acc;
    }, {});
  const subscriptionAlerts = Object.entries(expenseGroups)
    .filter(([, txs]) => txs.length >= 3 && txs.every((tx) => Math.abs(tx.amount - txs[0].amount) / (txs[0].amount || 1) < 0.3))
    .map(([description, txs]) => `${description} appears ${txs.length} times this month. Could be recurring.`);

  const impulseAlerts = Object.entries(expenseGroups)
    .filter(([, txs]) => {
      const amounts = txs.map((tx) => tx.amount);
      const average = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
      return txs.length === 1 && average < 500 && ['shopping', 'entertainment', 'food'].some((keyword) => txs[0].description.toLowerCase().includes(keyword));
    })
    .map(([description]) => `Impulse purchase: ${description}`);

  const heatWindow = eachDayOfInterval({ start: subDays(now, 27), end: now });
  const maxHeat = Math.max(...heatWindow.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return transactions.filter((t) => t.date === dateStr && t.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }), 0);
  const heatmap = heatWindow.map((day, index) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const amount = transactions.filter((t) => t.date === dateStr && t.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      weekday: format(day, 'EEE'),
      week: Math.floor(index / 7) + 1,
      amount,
      intensity: maxHeat > 0 ? amount / maxHeat : 0,
      date: format(day, 'MMM d'),
    };
  });

  const topCategories = categoryBreakdown.slice(0, 3);

  return {
    totalLifetimeSpent,
    totalLifetimeIncome,
    spentThisMonth,
    incomeThisMonth,
    remainingBudget,
    budgetUsedPercent,
    dailyAverage,
    weeklyComparison: {
      amount: lastWeekSpent,
      previous: prevWeekSpent,
      percentChange: weeklyChange,
      trend: weeklyChange > 5 ? 'up' : weeklyChange < -5 ? 'down' : 'flat',
      label: 'Last week vs previous week',
    },
    monthlyComparison: {
      amount: spentThisMonth,
      previous: lastMonthSpent,
      percentChange: monthlyChange,
      trend: monthlyChange > 5 ? 'up' : monthlyChange < -5 ? 'down' : 'flat',
      label: 'This month vs last month',
    },
    weekendTrend,
    lateNightSpending,
    spikeDays,
    subscriptionAlerts,
    impulseAlerts,
    heatmap,
    categoryBreakdown,
    dailySpending,
    transactionCount: transactions.length,
  };
}
