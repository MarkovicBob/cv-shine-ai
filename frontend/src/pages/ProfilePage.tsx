import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getProfile, updateProfile, getHistory, type Profile } from "@/lib/api";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [profileData, historyData] = await Promise.all([getProfile(), getHistory()]);
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        const analyses = historyData.analyses || [];
        setTotalAnalyses(analyses.length);
        const scores = analyses.map((a) => a.optimized_score).filter((s): s is number => s !== null);
        setAvgScore(scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);
      } catch { toast.error("Failed to load profile"); }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(fullName);
      toast.success("Profile updated");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const inputClass = "mt-1 w-full rounded-lg border border-input bg-input/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
  const tier = profile?.subscription_tier || "free";
  const analysesCount = profile?.analyses_count || 0;

  return (
    <div className="max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your account settings.</p>
        <div className="mt-8 space-y-6">
          <div className="card-surface-static p-6">
            <h2 className="font-semibold">Personal Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                {loading ? <Skeleton className="mt-1 h-10 w-full" /> : <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </div>
          </div>

          <div className="card-surface-static p-6">
            <h2 className="font-semibold">Subscription</h2>
            <div className="mt-4 flex items-center justify-between">
              <div>
                {loading ? <Skeleton className="h-5 w-40" /> : (
                  <>
                    <p className="text-sm">Current Plan: <span className="font-semibold text-primary capitalize">{tier}</span></p>
                    {tier === "free" && (
                      <>
                        <p className="mt-0.5 text-xs text-muted-foreground">{analysesCount} of 3 analyses used this month</p>
                        <div className="mt-2 h-1.5 w-48 rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((analysesCount / 3) * 100, 100)}%` }} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <Button variant="outline" size="sm">Upgrade to Pro</Button>
            </div>
          </div>

          <div className="card-surface-static p-6">
            <h2 className="font-semibold">Usage</h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {loading ? Array.from({ length: 3 }).map((_, i) => (<div key={i}><Skeleton className="h-8 w-12" /><Skeleton className="mt-1 h-3 w-20" /></div>)) : (
                <>
                  <div><p className="text-2xl font-bold tabular-nums">{totalAnalyses}</p><p className="text-xs text-muted-foreground">Total Analyses</p></div>
                  <div><p className="text-2xl font-bold tabular-nums">{avgScore ? `${avgScore}%` : "—"}</p><p className="text-xs text-muted-foreground">Avg. Score</p></div>
                  <div><p className="text-2xl font-bold tabular-nums">{totalAnalyses}</p><p className="text-xs text-muted-foreground">CVs Generated</p></div>
                </>
              )}
            </div>
          </div>

          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
