import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vocabRouter from "./vocab";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vocabRouter);

export default router;
