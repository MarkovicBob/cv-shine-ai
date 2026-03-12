import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getHistory, deleteAnalysis, generatePdf, type AnalysisRow } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const scoreClass = (s: number) => s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-destructive";

const HistoryPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [selected, setSelected] = useState<AnalysisRow | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getHistory()
      .then(({ analyses }) => { setRows(analyses); setLoading(false); })
      .catch(() => { toast.error("Failed to load history"); setLoading(false); });
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAnalysis(id);
      setRows((r) => r.filter((row) => row.id !== id));
      toast.success("Analysis deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRedownload = async (row: AnalysisRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!row.optimized_cv || !user) return;
    setDownloading(row.id);
    try {
      await generatePdf(row.optimized_cv, user.id, row.job_description || "");
      toast.success("PDF downloaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PDF");
    }
    setDownloading(null);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="mt-1 text-muted-foreground">Your past CV analyses and optimizations.</p>
        <div className="mt-8">
          <div className="card-surface-static overflow-hidden rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Job Title</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Original</th>
                  <th className="px-4 py-3 font-medium text-right">Optimized</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No analyses yet.</td></tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} onClick={() => setSelected(row)} className="border-b border-border/30 last:border-0 transition-colors hover:bg-secondary/30 cursor-pointer">
                      <td className="px-4 py-3 text-sm font-medium">{row.job_title || "Untitled"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.company || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(row.created_at)}</td>
                      <td className={cn("px-4 py-3 text-right text-sm font-bold tabular-nums", row.original_score !== null ? scoreClass(row.original_score) : "")}>{row.original_score ?? "—"}</td>
                      <td className={cn("px-4 py-3 text-right text-sm font-bold tabular-nums", row.optimized_score !== null ? scoreClass(row.optimized_score) : "")}>{row.optimized_score ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.optimized_cv && (
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={(e) => handleRedownload(row, e)} disabled={downloading === row.id}>
                              {downloading === row.id ? "..." : "PDF"}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(row.id, e)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.job_title || "Analysis Details"}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-6 pt-2">
              <div className="flex gap-6">
                <div><p className="text-xs text-muted-foreground">Company</p><p className="text-sm font-medium">{selected.company || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Original Score</p><p className={cn("text-sm font-bold", selected.original_score !== null ? scoreClass(selected.original_score) : "")}>{selected.original_score ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Optimized Score</p><p className={cn("text-sm font-bold", selected.optimized_score !== null ? scoreClass(selected.optimized_score) : "")}>{selected.optimized_score ?? "—"}</p></div>
              </div>
              {selected.missing_keywords?.length ? (
                <div><p className="text-sm font-semibold">Missing Keywords</p><div className="mt-2 flex flex-wrap gap-1.5">{selected.missing_keywords.map((kw) => (<span key={kw} className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{kw}</span>))}</div></div>
              ) : null}
              {selected.matched_keywords?.length ? (
                <div><p className="text-sm font-semibold">Matched Keywords</p><div className="mt-2 flex flex-wrap gap-1.5">{selected.matched_keywords.map((kw) => (<span key={kw} className="rounded-md bg-success/10 px-2 py-0.5 text-xs text-success">{kw}</span>))}</div></div>
              ) : null}
              {Array.isArray(selected.suggestions) && selected.suggestions.length > 0 && (
                <div><p className="text-sm font-semibold">Suggestions</p><div className="mt-2 space-y-2">{selected.suggestions.map((s, i) => (<div key={i} className="rounded-lg bg-secondary/50 p-3"><p className="text-xs font-semibold text-primary">{s.section}</p><p className="mt-1 text-sm text-muted-foreground">{s.suggestion}</p></div>))}</div></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;
