import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

// ── Parse CV file ──────────────────────────────────────────────────────────
export async function parseCvFile(file: File): Promise<{ text: string; char_count: number }> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/cv/parse`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Failed to parse CV");
  }

  return res.json();
}

// ── Analyze CV against job description ────────────────────────────────────
export async function analyzeCV(
  cvText: string,
  jobDescription: string,
  userId: string
): Promise<AnalysisResult> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      cv_text: cvText,
      job_description: jobDescription,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Analysis failed");
  }

  return res.json();
}

function detectLanguage(jobDescription: string): "de" | "en" {
  const germanWords = [
    "und", "die", "der", "das", "für", "mit", "bei", "wir", "ihr",
    "kenntnisse", "erfahrung", "entwickler", "stelle", "aufgaben",
    "anforderungen", "bewerbung", "deutsch", "arbeit", "beruf",
    "gesucht", "teamfähig", "abschluss", "studium", "lebenslauf",
  ];
  const lower = jobDescription.toLowerCase();
  const matches = germanWords.filter((w) => lower.includes(w)).length;
  return matches >= 3 ? "de" : "en";
}

function buildFileName(name: string | undefined, jobDescription: string): string {
  const lang = detectLanguage(jobDescription);
  const suffix = lang === "de" ? "Lebenslauf" : "Resume";

  if (!name) return `CV_${suffix}`;

  const parts = name.trim().split(/\s+/);
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (parts.length === 1) return `${capitalize(parts[0])}_${suffix}`;

  // "Firstname Lastname" → "Lastname_Firstname_Resume/Lebenslauf"
  const lastname = capitalize(parts[parts.length - 1]);
  const firstname = parts.slice(0, -1).map(capitalize).join("_");
  return `${lastname}_${firstname}_${suffix}`;
}

// ── Generate PDF via Python/ReportLab ─────────────────────────────────────
export async function generatePdf(optimizedCv: OptimizedCV, userId: string, jobDescription = ""): Promise<void> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/pdf/generate`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ optimized_cv: optimizedCv, user_id: userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "PDF generation failed" }));
    throw new Error(err.detail || "PDF generation failed");
  }

  // Trigger browser download
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${buildFileName(optimizedCv.name, jobDescription)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Get analysis history ───────────────────────────────────────────────────
export async function getHistory(): Promise<{ analyses: AnalysisRow[] }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/history`, { headers });
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

// ── Delete analysis ────────────────────────────────────────────────────────
export async function deleteAnalysis(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/history/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error("Failed to delete");
}

// ── Get profile ────────────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile`, { headers });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

// ── Update profile ─────────────────────────────────────────────────────────
export async function updateProfile(fullName: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface ExperienceItem {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  dates: string;
}

export interface OptimizedCV {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string[];
  certifications?: string[];
}

export interface SkillsGap {
  missing: string[];
  matched: string[];
}

export interface Suggestion {
  section: string;
  suggestion: string;
}

export interface AnalysisResult {
  ats_score: number;
  missing_keywords: string[];
  matched_keywords: string[];
  skills_gap: SkillsGap;
  suggestions: Suggestion[];
  optimized_cv: OptimizedCV;
  job_title?: string;
  company?: string;
}

export interface AnalysisRow {
  id: string;
  job_title: string | null;
  company: string | null;
  original_score: number | null;
  optimized_score: number | null;
  created_at: string;
  suggestions: Suggestion[] | null;
  optimized_cv: OptimizedCV | null;
  missing_keywords: string[] | null;
  matched_keywords: string[] | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  subscription_tier: string;
  analyses_count: number;
  created_at: string;
}
