import { Router } from "express";
import declareRouter from "./declare.route";
import superdocsRouter from "./superdocs.route";

const router = Router();

router.use("/declare", declareRouter);
router.use("/superdocs", superdocsRouter);

export default router;
