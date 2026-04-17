import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import kledoRouter from "./kledo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(kledoRouter);

export default router;
