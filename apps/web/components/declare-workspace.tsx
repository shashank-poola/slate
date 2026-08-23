"use client";

import { useMemo, useState } from "react";
import { Download, FileUp, LoaderCircle, Sparkles } from "lucide-react";
import {
  analyzeDeclaration,
  applyStatements,
  createStatements,
  decideSuperdocsChanges,
  exportManuscript,
  getSuperdocsJob,
  uploadManuscript,
  type Analysis,
  type Author,
  type DeclareFacts,
} from "@/lib/declare-api";

const creditRoles = [
  ["conceptualization", "Conceptualization"], ["data_curation", "Data curation"], ["formal_analysis", "Formal analysis"],
  ["funding_acquisition", "Funding acquisition"], ["investigation", "Investigation"], ["methodology", "Methodology"],
  ["project_administration", "Project administration"], ["resources", "Resources"], ["software", "Software"],
  ["supervision", "Supervision"], ["validation", "Validation"], ["visualization", "Visualization"],
  ["writing_original_draft", "Writing – original draft"], ["writing_review_editing", "Writing – review & editing"],
] as const;

const toAuthors = (names: string): Author[] => names.split("\n").map((name) => name.trim()).filter(Boolean).map((name, index) => ({
  id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "author"}-${index + 1}`,
  name,
}));

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const DeclareWorkspace = () => {
  const [authorNames, setAuthorNames] = useState("Shashank\nRahul\nPriya\nMei");
  const [contributions, setContributions] = useState("Shashank designed the study and built the software. Rahul collected and cleaned the data. Priya supervised the project. Mei helped with the research.");
  const [funding, setFunding] = useState("XYZ Foundation funded the study.");
  const [conflicts, setConflicts] = useState("No competing interests.");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [facts, setFacts] = useState<DeclareFacts | null>(null);
  const [statements, setStatements] = useState<Awaited<ReturnType<typeof createStatements>> | null>(null);
  const [sessionId] = useState(() => `declare-${crypto.randomUUID()}`);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const authors = useMemo(() => toAuthors(authorNames), [authorNames]);
  const pendingChanges = useMemo(() => {
    const metadata = job?.metadata;
    if (typeof metadata !== "object" || metadata === null || !("pending_changes" in metadata)) return [];
    return Array.isArray(metadata.pending_changes) ? metadata.pending_changes.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];
  }, [job]);

  const analyze = async () => {
    try {
      setBusy("analysis"); setMessage(null);
      const nextAnalysis = await analyzeDeclaration({ authors, contributions, funding, conflicts });
      setAnalysis(nextAnalysis);
      setFacts({
        authors,
        contributions: nextAnalysis.contributions.map((item) => ({
          authorId: item.authorId,
          evidence: item.evidence,
          roleIds: item.roleIds,
          status: item.status === "proposed" ? "approved" : "ambiguous",
        })),
        funding: nextAnalysis.funding,
        conflicts: nextAnalysis.conflicts,
      });
      setStatements(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Analysis failed."); }
    finally { setBusy(null); }
  };

  const updateRoles = (index: number, roleId: string) => setFacts((current) => {
    if (!current) return current;
    const next = [...current.contributions];
    const item = next[index]!;
    const roleIds = item.roleIds.includes(roleId) ? item.roleIds.filter((id) => id !== roleId) : [...item.roleIds, roleId];
    next[index] = { ...item, roleIds, status: roleIds.length ? "approved" : "ambiguous" };
    return { ...current, contributions: next };
  });

  const generateStatements = async () => {
    if (!facts) return;
    try { setBusy("statements"); setMessage(null); setStatements(await createStatements(facts)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Please finish the review first."); }
    finally { setBusy(null); }
  };

  const upload = async (file: File) => {
    try { setBusy("upload"); setMessage(null); await uploadManuscript({ sessionId, filename: file.name, fileBase64: await toBase64(file) }); setMessage("Manuscript uploaded. You can now propose the reviewed statements."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(null); }
  };

  const apply = async () => {
    if (!facts || !statements) return;
    try { setBusy("apply"); setMessage(null); const result = await applyStatements({ sessionId, facts }); setJobId(result.job_id); setJob(await getSuperdocsJob(result.job_id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to propose manuscript changes."); }
    finally { setBusy(null); }
  };

  const refreshJob = async () => { if (jobId) setJob(await getSuperdocsJob(jobId)); };
  const decide = async (approved: boolean, changeId?: string) => {
    if (!jobId) return;
    try { setBusy("approval"); await decideSuperdocsChanges({ sessionId, jobId, approved, changes: changeId ? [{ changeId, approved }] : pendingChanges.map((change) => ({ changeId: String(change.change_id), approved })) }); await refreshJob(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save that decision."); }
    finally { setBusy(null); }
  };
  const download = async () => {
    try { setBusy("export"); const blob = await exportManuscript(sessionId); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "declare-manuscript.docx"; link.click(); URL.revokeObjectURL(url); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(null); }
  };

  return <div className="mt-12 space-y-6">
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">01 · Source notes</p><h2 className="mt-2 text-xl font-medium">Tell Declare about the work.</h2></div><Sparkles className="size-5 text-zinc-400" /></div>
      <div className="mt-7 grid gap-5"><label className="text-sm font-medium">Authors <span className="font-normal text-zinc-500">one per line</span><textarea value={authorNames} onChange={(event) => setAuthorNames(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 p-3 font-normal outline-none focus:border-zinc-500" /></label>
        <label className="text-sm font-medium">Contributions<textarea value={contributions} onChange={(event) => setContributions(event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-zinc-200 p-3 font-normal outline-none focus:border-zinc-500" /></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Funding<textarea value={funding} onChange={(event) => setFunding(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 p-3 font-normal outline-none focus:border-zinc-500" /></label><label className="text-sm font-medium">Conflicts<textarea value={conflicts} onChange={(event) => setConflicts(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 p-3 font-normal outline-none focus:border-zinc-500" /></label></div>
      </div>
      <button onClick={analyze} disabled={busy !== null || !authors.length || !contributions.trim()} className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy === "analysis" && <LoaderCircle className="size-4 animate-spin" />} Analyze contributions</button>
    </section>

    {facts && <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">02 · Review</p><h2 className="mt-2 text-xl font-medium">Confirm every role before publishing.</h2>
      <div className="mt-6 space-y-4">{facts.contributions.map((item, index) => <div key={`${item.authorId}-${index}`} className="rounded-xl bg-zinc-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{authors.find((author) => author.id === item.authorId)?.name ?? item.authorId}</span><span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "ambiguous" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{item.status}</span></div><p className="mt-2 text-sm text-zinc-600">“{item.evidence}”</p><div className="mt-3 flex flex-wrap gap-2">{creditRoles.map(([id, label]) => <button key={id} onClick={() => updateRoles(index, id)} className={`rounded-full border px-3 py-1 text-xs ${item.roleIds.includes(id) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600"}`}>{label}</button>)}</div></div>)}</div>
      {analysis?.issues.length ? <p className="mt-5 text-sm text-amber-700">{analysis.issues.map((issue) => issue.message).join(" ")}</p> : null}
      <button onClick={generateStatements} disabled={busy !== null} className="mt-6 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy === "statements" ? "Generating…" : "Generate reviewed statements"}</button>
    </section>}

    {statements && <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">03 · Manuscript</p><h2 className="mt-2 text-xl font-medium">Send approved statements to your document.</h2><pre className="mt-5 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 font-sans text-sm leading-6 text-zinc-700">{`${statements.contributionStatement}\n\n${statements.fundingStatement}\n\n${statements.conflictStatement}`}</pre>
      <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium"><FileUp className="size-4" /> {busy === "upload" ? "Uploading…" : "Upload manuscript"}<input type="file" accept=".docx,.pdf,.txt,.rtf,.md,.html,.htm,.tex" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>
      <div className="mt-4 flex flex-wrap gap-3"><button onClick={apply} disabled={busy !== null} className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">Propose document changes</button>{jobId && <button onClick={refreshJob} className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-medium">Refresh status</button>}{pendingChanges.length > 1 && <><button onClick={() => decide(true)} disabled={busy !== null} className="rounded-full bg-emerald-100 px-5 py-2.5 text-sm font-medium text-emerald-900">Approve all</button><button onClick={() => decide(false)} disabled={busy !== null} className="rounded-full bg-rose-100 px-5 py-2.5 text-sm font-medium text-rose-900">Reject all</button></>}{job && <button onClick={download} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-medium"><Download className="size-4" /> Export</button>}</div>
      {job && <p className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">SuperDocs status: {String(job.status ?? "processing")}</p>}
      {pendingChanges.length > 0 && <div className="mt-4 space-y-3">{pendingChanges.map((change) => <article key={String(change.change_id)} className="rounded-xl border border-zinc-200 p-4 text-sm"><p className="font-medium">{String(change.ai_explanation ?? "Proposed manuscript change")}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-rose-50 p-3 text-zinc-600">{String(change.old_html ?? "New content")}</div><div className="rounded-lg bg-emerald-50 p-3 text-zinc-700">{String(change.new_html ?? "")}</div></div><div className="mt-3 flex gap-2"><button onClick={() => decide(true, String(change.change_id))} className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">Approve</button><button onClick={() => decide(false, String(change.change_id))} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium">Reject</button></div></article>)}</div>}
    </section>}
    {message && <p role="status" className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{message}</p>}
  </div>;
};
