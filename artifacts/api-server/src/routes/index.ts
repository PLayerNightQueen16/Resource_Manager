import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resourcesRouter from "./resources";
import collectionsRouter from "./collections";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(resourcesRouter);
router.use(collectionsRouter);
router.use(statsRouter);

export default router;
