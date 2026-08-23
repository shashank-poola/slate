import { Router } from "express";
import { analyze } from "../controllers/analyze.controller";
import { statements } from "../controllers/statement.controller";

const declareRouter = Router();

declareRouter.post("/analyze", analyze);
declareRouter.post("/statements", statements);

export default declareRouter;
