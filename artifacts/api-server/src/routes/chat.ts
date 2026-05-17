import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, expensesTable } from "@workspace/db";
import { gte, lte, and, sum, sql } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";

const router = Router();

function getMonthRange(monthsAgo = 0) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  return { start: `${yr}-${mo}-01`, end: `${yr}-${mo}-${String(lastDay).padStart(2, "0")}` };
}

router.post("/chat", async (req, res) => {
  try {
    const body = SendChatMessageBody.parse(req.body);

    // Gather recent financial context for the AI
    const thisMonth = getMonthRange(0);
    const [categoryRows, recentExpenses] = await Promise.all([
      db
        .select({ category: expensesTable.category, total: sum(expensesTable.amount), count: sql<number>`count(*)` })
        .from(expensesTable)
        .where(and(gte(expensesTable.date, thisMonth.start), lte(expensesTable.date, thisMonth.end)))
        .groupBy(expensesTable.category)
        .orderBy(sql`sum(${expensesTable.amount}) desc`),
      db
        .select()
        .from(expensesTable)
        .orderBy(sql`${expensesTable.date} desc`)
        .limit(10),
    ]);

    const monthlyTotal = categoryRows.reduce((acc, r) => acc + (parseFloat(r.total ?? "0") || 0), 0);
    const categoryBreakdown = categoryRows
      .map((r) => `  - ${r.category}: ₹${Math.round(parseFloat(r.total ?? "0")).toLocaleString()} (${r.count} transactions)`)
      .join("\n");

    const recentList = recentExpenses
      .map((e) => `  - ₹${Math.round(parseFloat(e.amount))} on ${e.category} (${e.description}) on ${e.date}`)
      .join("\n");

    const systemPrompt = `You are FinWise, a friendly and knowledgeable AI financial assistant for students and young professionals in India. 
You help users understand their spending habits, suggest savings strategies, and improve financial discipline.

Here is the user's current financial context:
- Monthly total spending so far: ₹${Math.round(monthlyTotal).toLocaleString()}
- Spending by category this month:
${categoryBreakdown || "  No expenses recorded yet"}
- Recent expenses:
${recentList || "  No recent expenses"}

Guidelines:
- Always use Indian Rupees (₹) for amounts
- Be specific with numbers when possible — reference the user's actual data
- Give actionable, practical advice suited for students and young professionals
- Be encouraging but honest about overspending
- Keep responses concise and friendly — 2-4 paragraphs max unless a detailed breakdown is needed
- Do not use emojis in your responses`;

    const history = (body.history ?? []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }));

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history,
      { role: "user" as const, content: body.message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1024,
      messages,
    });

    const reply = completion.choices[0]?.message?.content ?? "I'm having trouble responding right now. Please try again.";

    res.json({ reply });
  } catch (err) {
    req.log.error(err, "Failed to process chat message");
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

export default router;
