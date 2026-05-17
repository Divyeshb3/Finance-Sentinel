import { Router } from "express";
import { db, expensesTable, budgetsTable } from "@workspace/db";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import {
  CreateBudgetBody,
  UpdateBudgetBody,
  UpdateBudgetParams,
  DeleteBudgetParams,
  ListBudgetsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/budgets", async (req, res) => {
  try {
    const query = ListBudgetsQueryParams.parse(req.query);
    const month = query.month ?? new Date().toISOString().slice(0, 7);
    const [year, mo] = month.split("-").map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mo, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    const budgets = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.month, month));

    const categories = budgets.map((b) => b.category);

    const spentRows = await Promise.all(
      categories.map(async (cat) => {
        const [row] = await db
          .select({ total: sum(expensesTable.amount) })
          .from(expensesTable)
          .where(
            and(
              eq(expensesTable.category, cat),
              gte(expensesTable.date, startDate),
              lte(expensesTable.date, endDate)
            )
          );
        return { category: cat, spent: parseFloat(row?.total ?? "0") || 0 };
      })
    );

    const spentMap = Object.fromEntries(spentRows.map((r) => [r.category, r.spent]));

    const result = budgets.map((b) => {
      const spent = spentMap[b.category] ?? 0;
      const limit = parseFloat(b.amount);
      return {
        id: b.id,
        category: b.category,
        amount: limit,
        month: b.month,
        spent,
        remaining: Math.max(0, limit - spent),
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error(err, "Failed to list budgets");
    res.status(500).json({ error: "Failed to list budgets" });
  }
});

router.post("/budgets", async (req, res) => {
  try {
    const body = CreateBudgetBody.parse(req.body);

    const existing = await db
      .select()
      .from(budgetsTable)
      .where(
        and(
          eq(budgetsTable.category, body.category),
          eq(budgetsTable.month, body.month)
        )
      );

    let budget;
    if (existing.length > 0) {
      [budget] = await db
        .update(budgetsTable)
        .set({ amount: String(body.amount) })
        .where(eq(budgetsTable.id, existing[0].id))
        .returning();
    } else {
      [budget] = await db
        .insert(budgetsTable)
        .values({
          category: body.category,
          amount: String(body.amount),
          month: body.month,
        })
        .returning();
    }

    res.status(201).json({
      id: budget.id,
      category: budget.category,
      amount: parseFloat(budget.amount),
      month: budget.month,
      spent: 0,
      remaining: parseFloat(budget.amount),
    });
  } catch (err) {
    req.log.error(err, "Failed to create budget");
    res.status(400).json({ error: "Failed to create budget" });
  }
});

router.patch("/budgets/:id", async (req, res) => {
  try {
    const { id } = UpdateBudgetParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateBudgetBody.parse(req.body);

    const [budget] = await db
      .update(budgetsTable)
      .set({ amount: body.amount !== undefined ? String(body.amount) : undefined })
      .where(eq(budgetsTable.id, id))
      .returning();

    if (!budget) {
      res.status(404).json({ error: "Budget not found" });
      return;
    }

    res.json({
      id: budget.id,
      category: budget.category,
      amount: parseFloat(budget.amount),
      month: budget.month,
      spent: 0,
      remaining: parseFloat(budget.amount),
    });
  } catch (err) {
    req.log.error(err, "Failed to update budget");
    res.status(400).json({ error: "Failed to update budget" });
  }
});

router.delete("/budgets/:id", async (req, res) => {
  try {
    const { id } = DeleteBudgetParams.parse({ id: parseInt(req.params.id) });
    await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete budget");
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

export default router;
