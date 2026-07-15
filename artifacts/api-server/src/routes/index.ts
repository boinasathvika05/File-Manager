import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import categoriesRouter from "./categories";
import dashboardRouter from "./dashboard";
import gamificationRouter from "./gamification";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(categoriesRouter);
router.use(dashboardRouter);
router.use(gamificationRouter);
router.use(historyRouter);

export default router;
