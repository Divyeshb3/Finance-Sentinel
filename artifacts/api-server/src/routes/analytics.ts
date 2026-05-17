import { Router } from "express";
import { db, expensesTable, budgetsTable } from "@workspace/db";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";

const router = Router();

function getDateRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - offset);
  return {
    start: start.toISOString().slice(0, 10),
    end: now.toISOString().slice(0, 10),
  };
}

function getWeekRange(weeksAgo = 0): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - dayOfWeek - weeksAgo * 7);
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
  return {
    start: startOfThisWeek.toISOString().slice(0, 10),
    end: endOfThisWeek.toISOString().slice(0, 10),
  };
}

function getMonthRange(monthsAgo = 0): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsAgo;
  const d = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  return {
    start: `${yr}-${mo}-01`,
    end: `${yr}-${mo}-${String(lastDay).padStart(2, "0")}`,
  };
}

async function getTotal(start: string, end: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(expensesTable.amount) })
    .from(expensesTable)
    .where(and(gte(expensesTable.date, start), lte(expensesTable.date, end)));
  return parseFloat(row?.total ?? "0") || 0;
}

router.get("/analytics/summary", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const weekRange = getWeekRange(0);
    const monthRange = getMonthRange(0);

    const [todayTotal, weekTotal, monthTotal] = await Promise.all([
      getTotal(today, today),
      getTotal(weekRange.start, weekRange.end),
      getTotal(monthRange.start, monthRange.end),
    ]);

    const categoryRows = await db
      .select({ category: expensesTable.category, total: sum(expensesTable.amount) })
      .from(expensesTable)
      .where(and(gte(expensesTable.date, monthRange.start), lte(expensesTable.date, monthRange.end)))
      .groupBy(expensesTable.category)
      .orderBy(sql`sum(${expensesTable.amount}) desc`);

    const topCategory = categoryRows[0]?.category ?? "N/A";

    const lastMonthRange = getMonthRange(1);
    const lastMonthTotal = await getTotal(lastMonthRange.start, lastMonthRange.end);
    const savingsEstimate = lastMonthTotal > 0 ? Math.max(0, lastMonthTotal - monthTotal) : 0;

    const recentRows = await db
      .select()
      .from(expensesTable)
      .orderBy(sql`${expensesTable.date} desc, ${expensesTable.createdAt} desc`)
      .limit(5);

    const recentExpenses = recentRows.map((e) => ({
      id: e.id,
      amount: parseFloat(e.amount),
      category: e.category,
      description: e.description,
      date: e.date,
      paymentMethod: e.paymentMethod,
      createdAt: e.createdAt.toISOString(),
    }));

    res.json({ todayTotal, weekTotal, monthTotal, topCategory, savingsEstimate, recentExpenses });
  } catch (err) {
    req.log.error(err, "Failed to get analytics summary");
    res.status(500).json({ error: "Failed to get analytics summary" });
  }
});

router.get("/analytics/daily", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate are required" });
      return;
    }

    const rows = await db
      .select({ date: expensesTable.date, total: sum(expensesTable.amount) })
      .from(expensesTable)
      .where(and(gte(expensesTable.date, startDate), lte(expensesTable.date, endDate)))
      .groupBy(expensesTable.date)
      .orderBy(expensesTable.date);

    const result = rows.map((r) => ({
      date: r.date,
      total: parseFloat(r.total ?? "0") || 0,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err, "Failed to get daily analytics");
    res.status(500).json({ error: "Failed to get daily analytics" });
  }
});

router.get("/analytics/categories", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const monthRange = getMonthRange(0);
    const start = startDate ?? monthRange.start;
    const end = endDate ?? monthRange.end;

    const rows = await db
      .select({
        category: expensesTable.category,
        total: sum(expensesTable.amount),
        count: sql<number>`count(*)`,
      })
      .from(expensesTable)
      .where(and(gte(expensesTable.date, start), lte(expensesTable.date, end)))
      .groupBy(expensesTable.category)
      .orderBy(sql`sum(${expensesTable.amount}) desc`);

    const grandTotal = rows.reduce((acc, r) => acc + (parseFloat(r.total ?? "0") || 0), 0);

    const result = rows.map((r) => {
      const total = parseFloat(r.total ?? "0") || 0;
      return {
        category: r.category,
        total,
        count: Number(r.count),
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100 * 10) / 10 : 0,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error(err, "Failed to get category analytics");
    res.status(500).json({ error: "Failed to get category analytics" });
  }
});

router.get("/analytics/comparison", async (req, res) => {
  try {
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(1);
    const thisMonth = getMonthRange(0);
    const lastMonth = getMonthRange(1);

    const [thisWeekTotal, lastWeekTotal, thisMonthTotal, lastMonthTotal] = await Promise.all([
      getTotal(thisWeek.start, thisWeek.end),
      getTotal(lastWeek.start, lastWeek.end),
      getTotal(thisMonth.start, thisMonth.end),
      getTotal(lastMonth.start, lastMonth.end),
    ]);

    const weekChange = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;
    const monthChange = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

    const now = new Date();
    const daysInThisMonth = now.getDate();
    const lastMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

    res.json({
      thisWeek: thisWeekTotal,
      lastWeek: lastWeekTotal,
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      weekChange,
      monthChange,
      avgDailyThisMonth: daysInThisMonth > 0 ? Math.round(thisMonthTotal / daysInThisMonth) : 0,
      avgDailyLastMonth: lastMonthDays > 0 ? Math.round(lastMonthTotal / lastMonthDays) : 0,
    });
  } catch (err) {
    req.log.error(err, "Failed to get spending comparison");
    res.status(500).json({ error: "Failed to get spending comparison" });
  }
});

router.get("/analytics/health-score", async (req, res) => {
  try {
    const monthRange = getMonthRange(0);
    const lastMonthRange = getMonthRange(1);

    const [thisMonthTotal, lastMonthTotal] = await Promise.all([
      getTotal(monthRange.start, monthRange.end),
      getTotal(lastMonthRange.start, lastMonthRange.end),
    ]);

    const budgets = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.month, monthRange.start.slice(0, 7)));

    let budgetAdherence = 80;
    if (budgets.length > 0) {
      const catSpentRows = await db
        .select({ category: expensesTable.category, total: sum(expensesTable.amount) })
        .from(expensesTable)
        .where(and(gte(expensesTable.date, monthRange.start), lte(expensesTable.date, monthRange.end)))
        .groupBy(expensesTable.category);
      const catSpentMap = Object.fromEntries(catSpentRows.map((r) => [r.category, parseFloat(r.total ?? "0") || 0]));

      const adherenceScores = budgets.map((b) => {
        const spent = catSpentMap[b.category] ?? 0;
        const limit = parseFloat(b.amount);
        return limit > 0 ? Math.min(100, Math.max(0, (1 - Math.max(0, spent - limit) / limit) * 100)) : 100;
      });
      budgetAdherence = adherenceScores.reduce((a, b) => a + b, 0) / adherenceScores.length;
    }

    const savingsRate = lastMonthTotal > 0 ? Math.max(0, Math.min(100, ((lastMonthTotal - thisMonthTotal) / lastMonthTotal) * 100)) : 50;

    const dailyRows = await db
      .select({ date: expensesTable.date, total: sum(expensesTable.amount) })
      .from(expensesTable)
      .where(and(gte(expensesTable.date, monthRange.start), lte(expensesTable.date, monthRange.end)))
      .groupBy(expensesTable.date);

    let spendingConsistency = 70;
    if (dailyRows.length > 1) {
      const amounts = dailyRows.map((r) => parseFloat(r.total ?? "0") || 0);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((acc, a) => acc + Math.pow(a - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      spendingConsistency = avg > 0 ? Math.max(0, Math.min(100, 100 - (stdDev / avg) * 50)) : 70;
    }

    const score = Math.round(budgetAdherence * 0.4 + savingsRate * 0.35 + spendingConsistency * 0.25);

    let grade: string;
    let message: string;
    if (score >= 90) { grade = "A"; message = "Excellent financial discipline! Keep it up."; }
    else if (score >= 75) { grade = "B"; message = "Good job! A few tweaks and you'll be in great shape."; }
    else if (score >= 60) { grade = "C"; message = "Average spending health. Review your biggest categories."; }
    else if (score >= 45) { grade = "D"; message = "Spending needs attention. Consider setting budgets."; }
    else { grade = "F"; message = "High risk of overspending. Time to review your expenses."; }

    res.json({
      score,
      grade,
      budgetAdherence: Math.round(budgetAdherence),
      savingsRate: Math.round(savingsRate),
      spendingConsistency: Math.round(spendingConsistency),
      message,
    });
  } catch (err) {
    req.log.error(err, "Failed to get health score");
    res.status(500).json({ error: "Failed to get health score" });
  }
});

export default router;
