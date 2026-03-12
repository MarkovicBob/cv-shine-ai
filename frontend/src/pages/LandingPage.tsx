import { Upload, Search, FileCheck, ArrowRight, CheckCircle2, Zap, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ease = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease },
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">CVMatch Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[70svh] items-center pt-16">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <motion.div {...fadeUp} className="max-w-3xl">
            <h1 className="text-display text-foreground">
              Land Every Interview.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Our AI rewrites your CV for a 100/100 ATS score against any job description. Stop getting filtered out. Start getting callbacks.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Start Optimizing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="text-heading text-foreground"
          >
            Three steps. One optimized CV.
          </motion.h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Upload, step: "01", title: "Upload Your CV", desc: "Drop your PDF or DOCX. We parse every section — summary, experience, skills, education." },
              { icon: Search, step: "02", title: "Paste the Job", desc: "Paste a job URL or description. We extract every keyword, skill, and requirement." },
              { icon: FileCheck, step: "03", title: "Get Your Score", desc: "Receive your ATS score, missing keywords, and a fully rewritten CV ready to download." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="card-surface p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-mono text-xs text-muted-foreground">{item.step}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-heading">Why CVMatch Pro?</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Target, title: "Keyword Matching", desc: "Every keyword from the job description is naturally integrated into your CV." },
              { icon: Shield, title: "ATS-Safe Formatting", desc: "No tables, no columns, no graphics. Clean formatting that every ATS can parse." },
              { icon: Zap, title: "Instant Analysis", desc: "Get your score, gap analysis, and rewritten CV in under 30 seconds." },
              { icon: CheckCircle2, title: "Section-by-Section", desc: "Detailed suggestions for summary, experience, skills, and education sections." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease }}
                className="flex gap-4 rounded-lg p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-heading">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">Start free. Upgrade when you need more.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="card-surface p-8">
              <p className="text-sm font-medium text-muted-foreground">Free</p>
              <p className="mt-2 text-4xl font-bold tabular-nums">$0</p>
              <p className="mt-1 text-sm text-muted-foreground">3 analyses per month</p>
              <ul className="mt-6 space-y-3">
                {["3 CV analyses/month", "ATS score report", "Missing keywords list", "Basic suggestions"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
            {/* Pro */}
            <div className="card-surface relative overflow-hidden p-8">
              <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Popular
              </div>
              <p className="text-sm font-medium text-muted-foreground">Pro</p>
              <p className="mt-2 text-4xl font-bold tabular-nums">$19</p>
              <p className="mt-1 text-sm text-muted-foreground">per month</p>
              <ul className="mt-6 space-y-3">
                {["Unlimited analyses", "Full CV rewriting", "PDF generation", "Side-by-side diff view", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="hero" className="mt-8 w-full" asChild>
                <Link to="/register">Start Pro Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-heading">Trusted by job seekers</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Sarah K.", role: "Software Engineer", quote: "Went from 45% to 94% ATS score. Got 3 interviews in one week." },
              { name: "James T.", role: "Product Manager", quote: "The keyword analysis alone is worth it. I was missing critical terms." },
              { name: "Priya M.", role: "Data Analyst", quote: "Finally landed a role after months of silence. CVMatch Pro changed everything." },
            ].map((t) => (
              <div key={t.name} className="card-surface p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">CVMatch Pro</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 CVMatch Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
