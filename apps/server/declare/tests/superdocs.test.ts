import { describe, expect, test } from "bun:test";
import { env } from "../src/config/env.config";
import type { StatementsRequest } from "../src/types/statement.type";
import {
  approveSuperdocsChanges,
  exportSuperdocsDocument,
  startSuperdocsApply,
  uploadSuperdocsDocument,
} from "../src/utils/superdocs.utils";

const reviewedFacts: StatementsRequest = {
  authors: [
    { id: "shashank", name: "Shashank" },
    { id: "rahul", name: "Rahul" },
  ],
  contributions: [
    { authorId: "shashank", evidence: "designed the study", roleIds: ["conceptualization"], status: "approved" },
  ],
  funding: { status: "none", evidence: "" },
  conflicts: { status: "none", items: [] },
};

describe("SuperDocs", () => {
  test("uploads a document using the documented base64 endpoint", async () => {
    const originalFetch = globalThis.fetch;
    const originalApiKey = env.SUPERDOCS_API_KEY;
    env.SUPERDOCS_API_KEY = "test-key";

    globalThis.fetch = (async (url, init) => {
      expect(String(url)).toBe("https://api.superdocs.app/v1/documents/upload-base64");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        session_id: "declare-test",
        filename: "manuscript.docx",
        file_base64: "dGVzdA==",
      });
      return new Response(JSON.stringify({ document_id: "doc-123" }));
    }) as typeof fetch;

    try {
      expect(await uploadSuperdocsDocument({
        sessionId: "declare-test",
        filename: "manuscript.docx",
        fileBase64: "dGVzdA==",
        returnHtml: true,
      })).toMatchObject({ document_id: "doc-123" });
    } finally {
      globalThis.fetch = originalFetch;
      env.SUPERDOCS_API_KEY = originalApiKey;
    }
  });

  test("starts a reviewable async edit from approved statements", async () => {
    const originalFetch = globalThis.fetch;
    const originalApiKey = env.SUPERDOCS_API_KEY;
    env.SUPERDOCS_API_KEY = "test-key";

    globalThis.fetch = (async (url, init) => {
      expect(String(url)).toBe("https://api.superdocs.app/v1/chat/async");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        session_id: "declare-test",
        approval_mode: "ask_every_time",
      });
      return new Response(JSON.stringify({ job_id: "job-123" }));
    }) as typeof fetch;

    try {
      expect(await startSuperdocsApply({
        sessionId: "declare-test",
        facts: reviewedFacts,
        approvalMode: "ask_every_time",
      })).toMatchObject({ job_id: "job-123", session_id: "declare-test" });
    } finally {
      globalThis.fetch = originalFetch;
      env.SUPERDOCS_API_KEY = originalApiKey;
    }
  });

  test("sends researcher approval decisions and returns an exported file", async () => {
    const originalFetch = globalThis.fetch;
    const originalApiKey = env.SUPERDOCS_API_KEY;
    env.SUPERDOCS_API_KEY = "test-key";
    let requestCount = 0;

    globalThis.fetch = (async (url, init) => {
      requestCount += 1;

      if (requestCount === 1) {
        expect(String(url)).toBe("https://api.superdocs.app/v1/chat/declare-test/approve");
        expect(JSON.parse(String(init?.body))).toMatchObject({
          job_id: "job-123",
          approved: true,
          changes: [{ change_id: "change-1", approved: true }],
        });
        return new Response(JSON.stringify({ status: "processing" }));
      }

      expect(String(url)).toBe("https://api.superdocs.app/v1/documents/export");
      return new Response("document bytes", {
        headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      });
    }) as typeof fetch;

    try {
      await approveSuperdocsChanges({
        sessionId: "declare-test",
        jobId: "job-123",
        approved: true,
        changes: [{ changeId: "change-1", approved: true }],
      });

      const exported = await exportSuperdocsDocument({ sessionId: "declare-test", format: "docx" });
      expect(Buffer.isBuffer(exported.data)).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      env.SUPERDOCS_API_KEY = originalApiKey;
    }
  });
});
