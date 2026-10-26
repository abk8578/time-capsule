"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Mail,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Subtle haptic
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(10);
      }
    } catch {
      // Ignore
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: "/dashboard",
      });

      if (loginRes?.error) {
        router.push("/login?registered=true");
        return;
      }

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl rounded-full" />
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md space-y-8 rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/50 p-7 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-200 text-slate-950 shadow-xl star-glow-amber"
          >
            <Sparkles className="h-7 w-7" />
          </motion.div>
          <span className="mt-4 block text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/90">
            Genesis Alignment
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-normal tracking-tight text-text font-display">
            Ignite your constellation
          </h1>
          <p className="mt-2 text-xs text-muted font-light">
            Chart your sky and begin writing messages to your future self
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key={error}
              id="signup-error"
              role="alert"
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: [0, -10, 10, -8, 8, -4, 4, 0],
              }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-mono text-rose-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5"
            >
              Astronomer Name
            </label>
            <div className="relative group">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-2xl border border-border bg-card/60 py-3.5 pl-10 pr-4 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-300 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5"
            >
              Cosmic address (Email)
            </label>
            <div className="relative group">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-border bg-card/60 py-3.5 pl-10 pr-4 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-300 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5"
            >
              Master key (Min. 8 characters)
            </label>
            <div className="relative group">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border bg-card/60 py-3.5 pl-10 pr-4 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-300 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5"
            >
              Confirm master key
            </label>
            <div className="relative group">
              <CheckCircle2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
              <input
                id="signup-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border bg-card/60 py-3.5 pl-10 pr-4 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-300 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          <motion.button
            id="signup-submit"
            type="submit"
            disabled={loading || success}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`mt-3 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-xs font-mono uppercase tracking-wider font-semibold shadow-lg transition-all duration-300 cursor-pointer focus:outline-none star-glow-amber ${
              success
                ? "bg-amber-400 text-slate-950"
                : "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initializing sky chart...</span>
              </motion.div>
            ) : success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Constellation Created! Entering...</span>
              </motion.div>
            ) : (
              <>
                <span>Initialize Sky Chart</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted font-light">
          Already charted your sky?{" "}
          <Link
            id="link-to-login"
            href="/login"
            className="font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4 transition"
          >
            Enter orbit
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
