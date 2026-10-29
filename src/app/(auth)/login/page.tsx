"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, Loader2, Check } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
      });

      if (!res || res.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 500);
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
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
          Re-enter Orbit
        </span>
        <h1 className="mt-1 text-3xl sm:text-4xl font-normal tracking-tight text-text font-display">
          Welcome back
        </h1>
        <p className="mt-2 text-xs text-muted font-light">
          Sign in to consult your constellation and unlock your memories
        </p>
      </div>

      {/* Registration Success Banner */}
      {registered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-center text-xs font-mono text-amber-300"
        >
          Star constellation initialized! Please sign in with your credentials.
        </motion.div>
      )}

      {/* Error Alert: Shakes once and fades in */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key={error}
            id="login-error"
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
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5"
          >
            Cosmic address (Email)
          </label>
          <div className="relative group">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
            <input
              id="login-email"
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-[11px] font-mono uppercase tracking-widest text-muted"
            >
              Secret key (Password)
            </label>
            <Link
              id="link-to-forgot-password"
              href="/forgot-password"
              className="text-[11px] font-mono text-amber-400/90 hover:text-amber-300 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-card/60 py-3.5 pl-10 pr-4 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-300 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
            />
          </div>
        </div>

        <motion.button
          id="login-submit"
          type="submit"
          disabled={loading || success}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-xs font-mono uppercase tracking-wider font-semibold shadow-lg transition-all duration-300 cursor-pointer focus:outline-none star-glow-amber ${
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
              <span>Verifying credentials...</span>
            </motion.div>
          ) : success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>Aligned! Entering constellation...</span>
            </motion.div>
          ) : (
            <>
              <span>Align and Enter</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-muted font-light">
        Don&apos;t have a constellation yet?{" "}
        <Link
          id="link-to-signup"
          href="/signup"
          className="font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4 transition"
        >
          Ignite an account
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl rounded-full" />
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
