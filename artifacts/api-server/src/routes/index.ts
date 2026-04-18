import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import kledoRouter from "./kledo";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(kledoRouter);

export default router;
