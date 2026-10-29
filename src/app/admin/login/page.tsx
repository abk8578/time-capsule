"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, ArrowRight, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as an admin, redirect to /admin
  if (status === "authenticated" && session?.user?.role === "admin") {
    router.replace("/admin");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      // Also sync NextAuth user session for client state
      try {
        await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
      } catch {
        // NextAuth sync optional
      }

      // Sync settings to client storage & DOM immediately
      try {
        const settingsRes = await fetch("/api/user/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const t = settingsData?.settings?.theme;
          if (t === "light" || t === "dark") {
            localStorage.setItem("theme", t);
            sessionStorage.setItem("theme", t);
            document.cookie = `theme=${t}; path=/; max-age=31536000; SameSite=Lax`;
            if (t === "light") {
              document.documentElement.classList.remove("dark");
            } else {
              document.documentElement.classList.add("dark");
            }
          }
        }
      } catch {
        // Safe fallback
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("An unexpected error occurred during administrative authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-bg text-text">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Theme Toggle in corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-xl mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">
            Admin Command Deck
          </h1>
          <p className="mt-1 text-xs font-mono text-muted uppercase tracking-widest">
            Time Capsule Security & Operations
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-2xl shadow-2xl">
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-500 dark:text-rose-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@timecapsule.com"
                  className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5"
              >
                Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="galaxy-button w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Enter Deck</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <Link
              href="/"
              className="text-xs font-mono text-muted hover:text-text transition-colors"
            >
              ← Return to public portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
