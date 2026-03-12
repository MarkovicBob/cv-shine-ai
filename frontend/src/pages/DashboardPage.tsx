import { useEffect, useState } from "react";
import { FileText, TrendingUp, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { getProfile, getHistory, type AnalysisRow, type Profile } from "@/lib/api";
import { toast } from "sonner";

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentActivity, setRecentActivity] = useState<AnalysisRow[]>([]);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [profileData, historyData] = await Promise.all([
          getProfile(),
          getHistory(),
        ]);
        setProfile(profileData);
        const analyses = historyData.analyses || [];
        setRecentActivity(analyses.slice(0, 5));
        const scores = analyses.map((a) => a.optimized_score).filter((s): s is number => s !== null);
        setAvgScore(scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);
      } catch (err: any) {
        toast.error("Failed to load dashboard data");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const stats = [
    { label: "CVs Analyzed", value: String(profile?.analyses_count ?? 0), icon: FileText },
    { label: "Avg. ATS Score", value: avgScore ? `${avgScore}%` : "—", icon: TrendingUp },
    { label: "Jobs Applied", value: "—", icon: Briefcase },
  ];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
        <p className="text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Dashboard</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card-surface p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {loading ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-2 text-3xl font-bold tabular-nums">{stat.value}</p>}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button size="lg" asChild>
            <Link to="/optimizer">Optimize New CV <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="mt-4 space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : recentActivity.length === 0 ? (
              <div className="card-surface p-6 text-center text-sm text-muted-foreground">
                No analyses yet. <Link to="/optimizer" className="text-primary hover:underline">Optimize your first CV</Link>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="card-surface flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{item.job_title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{item.company || "—"} · {timeAgo(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.original_score !== null && (
                      <span className="text-xs text-muted-foreground">{item.original_score}/100 →</span>
                    )}
                    {item.optimized_score !== null && (
                      <span className={`text-sm font-bold tabular-nums ${item.optimized_score >= 80 ? "text-success" : item.optimized_score >= 60 ? "text-warning" : "text-destructive"}`}>
                        {item.optimized_score}/100
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
