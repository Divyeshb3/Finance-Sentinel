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
  return {
    start: `${yr}-${mo}-01`,
    end: `${yr}-${mo}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getWeekRange(weeksAgo = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek - weeksAgo * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

router.get("/insights", async (req, res) => {
  try {
    res.json([
      {
        id: "on-track",
        type: "positive",
        title: "Great Financial Discipline!",
        message: "Track more expenses to unlock personalized AI insights.",
        severity: "info",
        amount: null,
        savingsPotential: null,
      },
    ]);
  } catch (err) {
    req.log.error(err, "Failed to get insights");
    res.status(500).json({ error: "Failed to get insights" });
  }
});

export default router;
