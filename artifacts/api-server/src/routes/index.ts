import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import teamsRouter from "./teams";
import commentsRouter from "./comments";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(teamsRouter);
router.use(commentsRouter);
router.use(dashboardRouter);
router.use(aiRouter);

export default router;
