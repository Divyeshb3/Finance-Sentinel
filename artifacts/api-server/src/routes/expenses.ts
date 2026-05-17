import { Router } from "express";
import { db, expensesTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  CreateExpenseBody,
  UpdateExpenseBody,
  GetExpenseParams,
  UpdateExpenseParams,
  DeleteExpenseParams,
  ListExpensesQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/expenses", async (req, res) => {
  try {
    const query = ListExpensesQueryParams.parse(req.query);
    const conditions = [];

    if (query.startDate) {
      conditions.push(gte(expensesTable.date, query.startDate));
    }
    if (query.endDate) {
      conditions.push(lte(expensesTable.date, query.endDate));
    }
    if (query.category) {
      conditions.push(eq(expensesTable.category, query.category));
    }
    if (query.paymentMethod) {
      conditions.push(eq(expensesTable.paymentMethod, query.paymentMethod));
    }

    const expenses = await db
      .select()
      .from(expensesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expensesTable.date), desc(expensesTable.createdAt))
      .limit(query.limit ?? 100)
      .offset(query.offset ?? 0);

    const result = expenses.map((e) => ({
      id: e.id,
      amount: parseFloat(e.amount),
      category: e.category,
      description: e.description,
      date: e.date,
      paymentMethod: e.paymentMethod,
      createdAt: e.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err, "Failed to list expenses");
    res.status(500).json({ error: "Failed to list expenses" });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const body = CreateExpenseBody.parse(req.body);
    const [expense] = await db
      .insert(expensesTable)
      .values({
        amount: String(body.amount),
        category: body.category,
        description: body.description,
        date: body.date,
        paymentMethod: body.paymentMethod,
      })
      .returning();

    res.status(201).json({
      id: expense.id,
      amount: parseFloat(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create expense");
    res.status(400).json({ error: "Failed to create expense" });
  }
});

router.get("/expenses/:id", async (req, res) => {
  try {
    const { id } = GetExpenseParams.parse({ id: parseInt(req.params.id) });
    const [expense] = await db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.id, id));

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({
      id: expense.id,
      amount: parseFloat(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to get expense");
    res.status(500).json({ error: "Failed to get expense" });
  }
});

router.patch("/expenses/:id", async (req, res) => {
  try {
    const { id } = UpdateExpenseParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateExpenseBody.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (body.amount !== undefined) updates.amount = String(body.amount);
    if (body.category !== undefined) updates.category = body.category;
    if (body.description !== undefined) updates.description = body.description;
    if (body.date !== undefined) updates.date = body.date;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;

    const [expense] = await db
      .update(expensesTable)
      .set(updates)
      .where(eq(expensesTable.id, id))
      .returning();

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({
      id: expense.id,
      amount: parseFloat(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update expense");
    res.status(400).json({ error: "Failed to update expense" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    const { id } = DeleteExpenseParams.parse({ id: parseInt(req.params.id) });
    await db.delete(expensesTable).where(eq(expensesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete expense");
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
