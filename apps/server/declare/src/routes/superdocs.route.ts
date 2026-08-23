import { Router } from "express";
import {
  apply,
  approve,
  exportDocument,
  getJob,
  upload,
} from "../controllers/superdocs.controller";

const superdocsRouter = Router();

superdocsRouter.post("/apply", apply);
superdocsRouter.get("/jobs/:jobId", getJob);
superdocsRouter.post("/approve", approve);
superdocsRouter.post("/upload", upload);
superdocsRouter.post("/export", exportDocument);

export default superdocsRouter;
