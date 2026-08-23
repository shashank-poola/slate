type WorkspaceProgressProps = { hasReview: boolean; hasStatements: boolean; hasJob: boolean };

export const WorkspaceProgress = ({ hasReview, hasStatements, hasJob }: WorkspaceProgressProps) => (
  <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 sm:grid-cols-4">
    {[["01", "Source notes", true], ["02", "Review & confirm", hasReview], ["03", "Generate statements", hasStatements], ["04", "Manuscript handoff", hasJob]].map(([number, title, active]) => <div key={String(number)} className={`rounded-xl px-3 py-2.5 ${active ? "bg-zinc-900 text-white" : "text-zinc-400"}`}><span className="text-[11px] font-medium">{String(number)}</span><p className="mt-1 text-xs font-medium">{String(title)}</p></div>)}
  </div>
);
