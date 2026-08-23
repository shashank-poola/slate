import { env } from "../config/env.config";
import type {
  SuperdocsApplyRequest,
  SuperdocsApproveRequest,
  SuperdocsExportRequest,
  SuperdocsJob,
  SuperdocsUploadRequest,
} from "../types/superdocs.type";
import { buildStatements, buildSuperdocsMessage } from "./statement.utils";

const baseUrl = () => env.SUPERDOCS_BASE_URL.replace(/\/$/, "");

const superdocsHeaders = (): Record<string, string> => {
  if (!env.SUPERDOCS_API_KEY) {
    throw new Error("SUPERDOCS_API_KEY is not configured");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${env.SUPERDOCS_API_KEY}`,
  };
};

const parseJsonResponse = async (response: Response): Promise<unknown> => {
  const responseText = await response.text();

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`SuperDocs request failed with status ${response.status}`);
  }
};

const ensureOk = (response: Response, payload: unknown) => {
  if (response.ok) {
    return;
  }

  const message =
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : `SuperDocs request failed with status ${response.status}`;

  throw new Error(message);
};

export const startSuperdocsApply = async (
  request: SuperdocsApplyRequest,
): Promise<SuperdocsJob> => {
  const statements = buildStatements(request.facts);
  const message = buildSuperdocsMessage(statements);

  const response = await fetch(`${baseUrl()}/v1/chat/async`, {
    method: "POST",
    headers: {
      ...superdocsHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: request.sessionId,
      message,
      approval_mode: request.approvalMode,
      ...(request.documentHtml ? { document_html: request.documentHtml } : {}),
    }),
    signal: AbortSignal.timeout(env.SUPERDOCS_TIMEOUT_MS),
  });

  const payload = await parseJsonResponse(response);
  ensureOk(response, payload);

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("job_id" in payload) ||
    typeof payload.job_id !== "string"
  ) {
    throw new Error("SuperDocs response did not include a job ID");
  }

  return {
    job_id: payload.job_id,
    session_id: request.sessionId,
    status: "pending",
  };
};

export const getSuperdocsJob = async (jobId: string): Promise<unknown> => {
  const response = await fetch(`${baseUrl()}/v1/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: superdocsHeaders(),
    signal: AbortSignal.timeout(env.SUPERDOCS_TIMEOUT_MS),
  });

  const payload = await parseJsonResponse(response);
  ensureOk(response, payload);

  return payload;
};

export const approveSuperdocsChanges = async (
  request: SuperdocsApproveRequest,
): Promise<unknown> => {
  const response = await fetch(
    `${baseUrl()}/v1/chat/${encodeURIComponent(request.sessionId)}/approve`,
    {
      method: "POST",
      headers: {
        ...superdocsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_id: request.jobId,
        approved: request.approved,
        ...(request.feedback ? { feedback: request.feedback } : {}),
        ...(request.changes
          ? {
              changes: request.changes.map((change) => ({
                change_id: change.changeId,
                approved: change.approved,
                ...(change.feedback ? { feedback: change.feedback } : {}),
              })),
            }
          : {}),
      }),
      signal: AbortSignal.timeout(env.SUPERDOCS_TIMEOUT_MS),
    },
  );

  const payload = await parseJsonResponse(response);
  ensureOk(response, payload);

  return payload;
};

export const exportSuperdocsDocument = async (
  request: SuperdocsExportRequest,
): Promise<{ contentType: string; data: Buffer | unknown }> => {
  const response = await fetch(`${baseUrl()}/v1/documents/export`, {
    method: "POST",
    headers: {
      ...superdocsHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: request.format,
      ...(request.sessionId ? { session_id: request.sessionId } : {}),
      ...(request.documentHtml ? { html: request.documentHtml } : {}),
      ...(request.filename ? { filename: request.filename } : {}),
    }),
    signal: AbortSignal.timeout(env.SUPERDOCS_TIMEOUT_MS),
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await parseJsonResponse(response);
    ensureOk(response, payload);
    return { contentType, data: payload };
  }

  if (!response.ok) {
    throw new Error(`SuperDocs export failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { contentType, data: Buffer.from(arrayBuffer) };
};

export const uploadSuperdocsDocument = async (
  request: SuperdocsUploadRequest,
): Promise<unknown> => {
  const response = await fetch(`${baseUrl()}/v1/documents/upload-base64`, {
    method: "POST",
    headers: {
      ...superdocsHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: request.sessionId,
      filename: request.filename,
      file_base64: request.fileBase64,
      return_html: request.returnHtml,
    }),
    signal: AbortSignal.timeout(env.SUPERDOCS_TIMEOUT_MS),
  });

  const payload = await parseJsonResponse(response);
  ensureOk(response, payload);

  return payload;
};
