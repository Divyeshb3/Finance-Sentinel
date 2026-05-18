import type { Expense } from "./firestore";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function lastWeekRange() {
  const monday = new Date(weekRange());
  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);
  const lastSunday = new Date(monday);
  lastSunday.setDate(monday.getDate() - 1);
  return {
    start: lastMonday.toISOString().slice(0, 10),
    end: lastSunday.toISOString().slice(0, 10),
  };
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export interface Summary {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  savingsEstimate: number;
  categorySpend: { category: string; total: number }[];
  recentExpenses: Expense[];
}

export function computeSummary(expenses: Expense[]): Summary {
  const today = todayStr();
  const weekStart = weekRange();
  const month = currentMonth();

  let todayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;
  const catMap: Record<string, number> = {};

  for (const e of expenses) {
    if (e.date === today) todayTotal += e.amount;
    if (e.date >= weekStart) weekTotal += e.amount;
    if (e.date.startsWith(month)) {
      monthTotal += e.amount;
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
    }
  }

  const categorySpend = Object.entries(catMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    todayTotal,
    weekTotal,
    monthTotal,
    savingsEstimate: Math.max(0, 30000 - monthTotal),
    categorySpend,
    recentExpenses: expenses.slice(0, 5),
  };
}

export interface DailyPoint {
  date: string;
  total: number;
}

export function computeDailyAnalytics(expenses: Expense[], startDate: string, endDate: string): DailyPoint[] {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    if (e.date >= startDate && e.date <= endDate) {
      map[e.date] = (map[e.date] ?? 0) + e.amount;
    }
  }
  return Object.entries(map)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface CategoryPoint {
  category: string;
  total: number;
  count: number;
}

export function computeCategoryAnalytics(expenses: Expense[], startDate: string, endDate: string): CategoryPoint[] {
  const map: Record<string, { total: number; count: number }> = {};
  for (const e of expenses) {
    if (e.date >= startDate && e.date <= endDate) {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0 };
      map[e.category].total += e.amount;
      map[e.category].count += 1;
    }
  }
  return Object.entries(map)
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);
}

export interface Comparison {
  thisWeek: number;
  lastWeek: number;
  weekChange: number;
}

export function computeComparison(expenses: Expense[]): Comparison {
  const weekStart = weekRange();
  const { start: lwStart, end: lwEnd } = lastWeekRange();

  let thisWeek = 0;
  let lastWeek = 0;
  for (const e of expenses) {
    if (e.date >= weekStart) thisWeek += e.amount;
    if (e.date >= lwStart && e.date <= lwEnd) lastWeek += e.amount;
  }
  const weekChange = lastWeek === 0 ? 0 : ((thisWeek - lastWeek) / lastWeek) * 100;
  return { thisWeek, lastWeek, weekChange };
}

export interface HealthScore {
  score: number;
  grade: string;
  message: string;
}

export function computeHealthScore(expenses: Expense[]): HealthScore {
  if (expenses.length === 0) {
    return { score: 100, grade: "A", message: "Great start! Add expenses to track your health." };
  }

  const month = currentMonth();
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  let score = 100;
  const MONTHLY_BUDGET = 30000;
  const DAILY_LIMIT = 1500;

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysPassed = Math.max(1, new Date().getDate());
  const avgDaily = monthTotal / daysPassed;

  if (monthTotal > MONTHLY_BUDGET) score -= 30;
  else if (monthTotal > MONTHLY_BUDGET * 0.8) score -= 15;

  if (avgDaily > DAILY_LIMIT * 1.5) score -= 20;
  else if (avgDaily > DAILY_LIMIT) score -= 10;

  const uniqueDays = new Set(monthExpenses.map((e) => e.date)).size;
  if (uniqueDays < daysPassed * 0.3 && monthTotal > 0) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let grade: string;
  let message: string;
  if (score >= 90) { grade = "A"; message = "Excellent! You're well within your budget."; }
  else if (score >= 75) { grade = "B"; message = "Good spending habits. Keep it up!"; }
  else if (score >= 60) { grade = "C"; message = "Spending is moderate. Watch your daily limits."; }
  else if (score >= 40) { grade = "D"; message = "Overspending detected. Review your expenses."; }
  else { grade = "F"; message = "Spending is very high. Time to cut back!"; }

  return { score, grade, message };
}
