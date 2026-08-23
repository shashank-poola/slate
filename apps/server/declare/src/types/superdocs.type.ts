import type { z } from "zod";
import type {
  superdocsApplySchema,
  superdocsApproveSchema,
  superdocsExportSchema,
  superdocsUploadSchema,
} from "../schema/superdocs.schema";

export type SuperdocsApplyRequest = z.infer<typeof superdocsApplySchema>;
export type SuperdocsApproveRequest = z.infer<typeof superdocsApproveSchema>;
export type SuperdocsExportRequest = z.infer<typeof superdocsExportSchema>;
export type SuperdocsUploadRequest = z.infer<typeof superdocsUploadSchema>;

export type SuperdocsJob = {
  job_id: string;
  session_id: string;
  status: string;
  message?: string;
};
