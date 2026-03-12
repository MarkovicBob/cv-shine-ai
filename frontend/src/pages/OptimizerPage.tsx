import { useState, useCallback } from "react";
import { Upload, FileText, Link2, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { parseCvFile, analyzeCV, generatePdf, type AnalysisResult } from "@/lib/api";

const steps = [
  { id: 1, label: "Upload CV", icon: Upload },
  { id: 2, label: "Job Posting", icon: Link2 },
  { id: 3, label: "Analysis", icon: CheckCircle2 },
];

const AnimatedScore = ({ value }: { value: number }) => {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useState(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    animate(motionVal, value, { duration: 1.4, ease: [0.32, 0.72, 0, 1] });
    return () => unsub();
  });
  return <>{display}</>;
};

const BLOCKED_DOMAINS = ["linkedin.com", "xing.com"];

function detectJobInputType(text: string): "url-blocked" | "url-other" | "text" {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    if (BLOCKED_DOMAINS.some((d) => url.hostname.includes(d))) return "url-blocked";
    return "url-other";
  } catch {
    return "text";
  }
}

const OptimizerPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  const score = result?.ats_score ?? 0;
  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  const strokeColor = score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-destructive";

  const processFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB."); return; }
    setFileName(file.name);
    setParsing(true);
    try {
      const { text, char_count } = await parseCvFile(file);
      setCvText(text);
      toast.success(`Parsed ${char_count.toLocaleString()} characters from ${file.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse file");
      setFileName(null); setCvText("");
    }
    setParsing(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); };

  const handleAnalyze = async () => {
    if (!user) { toast.error("Please log in first"); return; }
    if (detectJobInputType(jobDescription) === "url-blocked") {
      toast.error("LinkedIn link nije podržan — nalepi tekst oglasa direktno.");
      setCurrentStep(2);
      return;
    }
    setIsAnalyzing(true); setAnalysisComplete(false);
    try {
      const data = await analyzeCV(cvText, jobDescription, user.id);
      setResult(data); setAnalysisComplete(true);
      toast.success("Analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed. Please try again.");
      setCurrentStep(2);
    }
    setIsAnalyzing(false);
  };

  const handleGeneratePdf = async () => {
    if (!result?.optimized_cv || !user) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdf(result.optimized_cv, user.id, jobDescription);
      toast.success("PDF downloaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PDF");
    }
    setIsGeneratingPdf(false);
  };

  const resetAll = () => { setCurrentStep(1); setFileName(null); setCvText(""); setJobDescription(""); setAnalysisComplete(false); setResult(null); };

  return (
    <div className="max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
        <h1 className="text-2xl font-bold tracking-tight">CV Optimizer</h1>
        <p className="mt-1 text-muted-foreground">Optimize your CV against any job description.</p>
        <div className="mt-8 flex gap-8">
          <div className="w-48 shrink-0">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-start gap-3 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors", isActive && "bg-primary text-primary-foreground", isCompleted && "bg-success text-success-foreground", !isActive && !isCompleted && "bg-secondary text-muted-foreground")}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    {step.id < 3 && <div className={cn("mt-2 h-8 w-px", isCompleted ? "bg-success" : "bg-border")} />}
                  </div>
                  <div className="pt-1"><p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{step.label}</p></div>
                </div>
              );
            })}
          </div>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className={cn("card-surface-static flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors", isDragging ? "border-primary bg-primary/5" : "border-border", fileName && !parsing && "border-success/50 bg-success/5")}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
                    {parsing ? (<><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="mt-3 font-medium">Parsing {fileName}...</p><p className="mt-1 text-sm text-muted-foreground">Python/pdfplumber is extracting text</p></>)
                      : fileName ? (<><FileText className="h-10 w-10 text-success" /><p className="mt-3 font-medium">{fileName}</p><p className="mt-1 text-sm text-muted-foreground">{cvText.length.toLocaleString()} characters extracted</p><p className="mt-2 max-w-md truncate text-xs text-muted-foreground">{cvText.substring(0, 200)}...</p><Button variant="ghost" size="sm" className="mt-3" onClick={() => { setFileName(null); setCvText(""); }}>Remove</Button></>)
                      : (<><Upload className="h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">Drop your CV here</p><p className="mt-1 text-sm text-muted-foreground">PDF or DOCX, max 5MB</p><label className="mt-4"><Button variant="outline" size="sm" asChild><span>Browse Files</span></Button><input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileSelect} /></label></>)}
                  </div>
                  <div className="mt-6 flex justify-end"><Button disabled={!cvText || parsing} onClick={() => setCurrentStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button></div>
                </motion.div>
              )}

              {currentStep === 2 && (() => {
                const inputType = detectJobInputType(jobDescription);
                const isBlocked = inputType === "url-blocked";
                const isOtherUrl = inputType === "url-other";
                const canAnalyze = inputType === "text" && jobDescription.trim().length >= 50;
                return (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <div className="card-surface-static p-6">
                      <label className="text-sm font-medium">Job Description</label>
                      <p className="mt-1 text-xs text-muted-foreground">Paste the full job description for best ATS matching.</p>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description here — requirements, responsibilities, skills..."
                        className={cn(
                          "mt-3 h-56 w-full resize-none rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                          isBlocked
                            ? "border-destructive bg-destructive/5 focus:ring-destructive"
                            : isOtherUrl
                            ? "border-warning bg-warning/5 focus:ring-warning"
                            : "border-input bg-input/50 focus:ring-ring"
                        )}
                      />

                      {isBlocked && (
                        <div className="mt-3 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <div>
                            <p className="text-sm font-medium text-destructive">LinkedIn ne dozvoljava automatsko čitanje</p>
                            <p className="mt-0.5 text-xs text-destructive/80">
                              Otvori oglas na LinkedIn-u, selektuj ceo tekst opisa posla (Ctrl+A ili ručno), kopiraj ga i nalepi ovde umesto linka.
                            </p>
                          </div>
                        </div>
                      )}

                      {isOtherUrl && (
                        <div className="mt-3 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                          <div>
                            <p className="text-sm font-medium text-warning">Detektovan je URL — pokušaćemo da ga pročitamo</p>
                            <p className="mt-0.5 text-xs text-warning/80">
                              Ako sajt blokira pristup, dobićeš grešku. Preporučujemo da ručno nalepiš tekst oglasa za bolje rezultate.
                            </p>
                          </div>
                        </div>
                      )}

                      {!isBlocked && !isOtherUrl && (
                        <p className="mt-2 text-xs text-muted-foreground">{jobDescription.length.toLocaleString()} characters</p>
                      )}
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button variant="ghost" onClick={() => setCurrentStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                      <Button disabled={!canAnalyze && !isOtherUrl} onClick={() => { setCurrentStep(3); handleAnalyze(); }}>
                        Analyze with AI <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })()}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {isAnalyzing ? (
                    <div className="card-surface-static flex flex-col items-center justify-center p-16 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="mt-4 font-medium">Analyzing your CV against job requirements...</p>
                      <p className="mt-1 text-sm text-muted-foreground">Claude Sonnet is optimizing for 100/100 ATS score</p>
                      <p className="mt-1 text-xs text-muted-foreground">This usually takes 15–30 seconds</p>
                    </div>
                  ) : analysisComplete && result ? (
                    <div className="space-y-6">
                      <div className="card-surface-static flex items-center gap-8 p-8">
                        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" className="stroke-secondary" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="none" className={strokeColor} strokeWidth="8" strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.32, 0.72, 0, 1)" }} />
                          </svg>
                          <span className={cn("absolute text-2xl font-bold tabular-nums", scoreColor)}><AnimatedScore value={score} /></span>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">Original ATS Score</p>
                          <p className="mt-1 text-sm text-muted-foreground">Your original CV scored {score}/100. Optimized CV targets 100/100.</p>
                          {result.job_title && <p className="mt-2 text-xs text-muted-foreground">Position: <span className="font-medium text-foreground">{result.job_title}</span>{result.company && <> at <span className="font-medium text-foreground">{result.company}</span></>}</p>}
                        </div>
                      </div>

                      {result.missing_keywords.length > 0 && (
                        <div className="card-surface-static p-6">
                          <h3 className="font-semibold">Missing Keywords</h3>
                          <p className="mt-1 text-xs text-muted-foreground">These keywords were added to your optimized CV</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {result.missing_keywords.map((kw) => (<span key={kw} className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">{kw}</span>))}
                          </div>
                        </div>
                      )}

                      <div className="card-surface-static p-6">
                        <h3 className="font-semibold">Skills Analysis</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div><p className="text-xs font-medium text-success">✓ Matched Skills</p><div className="mt-2 flex flex-wrap gap-1.5">{result.skills_gap.matched.map((s) => (<span key={s} className="rounded-md bg-success/10 px-2 py-0.5 text-xs text-success">{s}</span>))}</div></div>
                          <div><p className="text-xs font-medium text-destructive">✗ Missing Skills</p><div className="mt-2 flex flex-wrap gap-1.5">{result.skills_gap.missing.map((s) => (<span key={s} className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{s}</span>))}</div></div>
                        </div>
                      </div>

                      <div className="card-surface-static p-6">
                        <h3 className="font-semibold">Optimization Suggestions</h3>
                        <div className="mt-4 space-y-3">
                          {result.suggestions.map((s, i) => (<div key={i} className="rounded-lg bg-secondary/50 p-4"><p className="text-xs font-semibold text-primary">{s.section}</p><p className="mt-1 text-sm text-muted-foreground">{s.suggestion}</p></div>))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                          {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          {isGeneratingPdf ? "Generating PDF..." : "Download Optimized CV (PDF)"}
                        </Button>
                        <Button variant="outline" onClick={resetAll}>Start Over</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">PDF generated by Python/ReportLab — ATS-safe, single column layout.</p>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OptimizerPage;
