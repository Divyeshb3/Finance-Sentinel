import { Router, type IRouter } from "express";
import healthRouter from "./health";
import expensesRouter from "./expenses";
import budgetsRouter from "./budgets";
import analyticsRouter from "./analytics";
import insightsRouter from "./insights";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(expensesRouter);
router.use(budgetsRouter);
router.use(analyticsRouter);
router.use(insightsRouter);
router.use(chatRouter);

export default router;
