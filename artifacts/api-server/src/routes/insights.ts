import { Router } from "express";
import { db, expensesTable } from "@workspace/db";
import { and, gte, lte, sum, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

const router = Router();

function getMonthRange(monthsAgo = 0) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  return { start: `${yr}-${mo}-01`, end: `${yr}-${mo}-${String(lastDay).padStart(2, "0")}` };
}

function getWeekRange(weeksAgo = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek - weeksAgo * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

router.get("/insights", async (req, res) => {
  try {
    const thisMonth = getMonthRange(0);
    const lastMonth = getMonthRange(1);
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(1);

    const [thisMonthRows, lastMonthRows, thisWeekRows, lastWeekRows] = await Promise.all([
      db
        .select({ category: expensesTable.category, total: sum(expensesTable.amount), count: sql<number>`count(*)` })
        .from(expensesTable)
        .where(and(gte(expensesTable.date, thisMonth.start), lte(expensesTable.date, thisMonth.end)))
        .groupBy(expensesTable.category),
      db
        .select({ category: expensesTable.category, total: sum(expensesTable.amount) })
        .from(expensesTable)
        .where(and(gte(expensesTable.date, lastMonth.start), lte(expensesTable.date, lastMonth.end)))
        .groupBy(expensesTable.category),
      db
        .select({ category: expensesTable.category, total: sum(expensesTable.amount), count: sql<number>`count(*)` })
        .from(expensesTable)
        .where(and(gte(expensesTable.date, thisWeek.start), lte(expensesTable.date, thisWeek.end)))
        .groupBy(expensesTable.category),
      db
        .select({ category: expensesTable.category, total: sum(expensesTable.amount) })
        .from(expensesTable)
        .where(and(gte(expensesTable.date, lastWeek.start), lte(expensesTable.date, lastWeek.end)))
        .groupBy(expensesTable.category),
    ]);

    const thisMonthMap = Object.fromEntries(thisMonthRows.map((r) => [r.category, { total: parseFloat(r.total ?? "0") || 0, count: Number(r.count) }]));
    const lastMonthMap = Object.fromEntries(lastMonthRows.map((r) => [r.category, parseFloat(r.total ?? "0") || 0]));
    const thisWeekMap = Object.fromEntries(thisWeekRows.map((r) => [r.category, { total: parseFloat(r.total ?? "0") || 0, count: Number(r.count) }]));
    const lastWeekMap = Object.fromEntries(lastWeekRows.map((r) => [r.category, parseFloat(r.total ?? "0") || 0]));

    const insights: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      severity: string;
      amount: number | null;
      savingsPotential: number | null;
    }> = [];

    // Check frequent food delivery / food spending
    const foodWeek = thisWeekMap["Food"];
    if (foodWeek && foodWeek.total > 1500) {
      insights.push({
        id: "food-weekly-high",
        type: "overspending",
        title: "High Food Spending This Week",
        message: `You spent ₹${Math.round(foodWeek.total).toLocaleString()} on food this week. Consider cooking at home more often.`,
        severity: foodWeek.total > 3000 ? "danger" : "warning",
        amount: foodWeek.total,
        savingsPotential: Math.round(foodWeek.total * 0.4),
      });
    }

    // Check shopping impulse spending
    const shoppingMonth = thisMonthMap["Shopping"];
    if (shoppingMonth && shoppingMonth.count >= 5) {
      insights.push({
        id: "shopping-frequent",
        type: "impulse",
        title: "Frequent Shopping Purchases",
        message: `You made ${shoppingMonth.count} shopping purchases this month totaling ₹${Math.round(shoppingMonth.total).toLocaleString()}. Many could be impulse buys.`,
        severity: shoppingMonth.count >= 10 ? "danger" : "warning",
        amount: shoppingMonth.total,
        savingsPotential: Math.round(shoppingMonth.total * 0.3),
      });
    }

    // Entertainment spending increase
    const entWeek = thisWeekMap["Entertainment"];
    const entLastWeek = lastWeekMap["Entertainment"] ?? 0;
    if (entWeek && entLastWeek > 0) {
      const increase = ((entWeek.total - entLastWeek) / entLastWeek) * 100;
      if (increase > 30) {
        insights.push({
          id: "entertainment-spike",
          type: "trend",
          title: "Entertainment Spending Up",
          message: `Entertainment expenses increased by ${Math.round(increase)}% compared to last week. This week: ₹${Math.round(entWeek.total).toLocaleString()}.`,
          severity: increase > 60 ? "danger" : "warning",
          amount: entWeek.total,
          savingsPotential: Math.round(entWeek.total * 0.25),
        });
      }
    }

    // Month-over-month increase in any category
    for (const cat of Object.keys(thisMonthMap)) {
      const thisAmt = thisMonthMap[cat].total;
      const lastAmt = lastMonthMap[cat] ?? 0;
      if (lastAmt > 0 && thisAmt > lastAmt) {
        const change = ((thisAmt - lastAmt) / lastAmt) * 100;
        if (change > 40 && thisAmt > 500) {
          insights.push({
            id: `month-increase-${cat.toLowerCase()}`,
            type: "trend",
            title: `${cat} Spending Rose Significantly`,
            message: `Your ${cat} spending increased by ${Math.round(change)}% this month (₹${Math.round(thisAmt).toLocaleString()} vs ₹${Math.round(lastAmt).toLocaleString()} last month).`,
            severity: change > 70 ? "danger" : "warning",
            amount: thisAmt,
            savingsPotential: Math.round(lastAmt * 0.1),
          });
        }
      }
    }

    // Recharge / bills savings tip
    const rechargeMonth = thisMonthMap["Recharge"];
    if (rechargeMonth && rechargeMonth.total > 1000) {
      insights.push({
        id: "recharge-optimize",
        type: "savings",
        title: "Optimize Recharge Plans",
        message: `You spent ₹${Math.round(rechargeMonth.total).toLocaleString()} on recharges this month. Switching to annual plans could save you up to 30%.`,
        severity: "info",
        amount: rechargeMonth.total,
        savingsPotential: Math.round(rechargeMonth.total * 0.3 * 12),
      });
    }

    // Small repeated purchases (snacks etc — via high Food count)
    if (foodWeek && foodWeek.count >= 10) {
      insights.push({
        id: "small-food-purchases",
        type: "impulse",
        title: "Repeated Small Food Purchases",
        message: `You made ${foodWeek.count} food transactions this week. Small daily purchases add up — you could save ₹${Math.round(foodWeek.total * 0.3).toLocaleString()}/week by reducing snack runs.`,
        severity: "info",
        amount: foodWeek.total,
        savingsPotential: Math.round(foodWeek.total * 0.3 * 4),
      });
    }

    // Overall savings potential
    const thisMonthTotal = Object.values(thisMonthMap).reduce((a, v) => a + v.total, 0);
    if (thisMonthTotal > 5000 && insights.length === 0) {
      insights.push({
        id: "general-savings",
        type: "savings",
        title: "Reduce Impulse Spending",
        message: `By cutting back on non-essentials by 20%, you could save ₹${Math.round(thisMonthTotal * 0.2).toLocaleString()} this month.`,
        severity: "info",
        amount: thisMonthTotal,
        savingsPotential: Math.round(thisMonthTotal * 0.2),
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: "on-track",
        type: "positive",
        title: "Great Financial Discipline!",
        message: "No unusual spending patterns detected. Keep tracking your expenses consistently.",
        severity: "info",
        amount: null,
        savingsPotential: null,
      });
    }

    res.json(insights);
  } catch (err) {
    req.log.error(err, "Failed to get insights");
    res.status(500).json({ error: "Failed to get insights" });
  }
});

export default router;
