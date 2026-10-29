"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please provide your cosmic email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to dispatch recovery link.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("An unexpected network glitch occurred. Please try again.");
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
            <KeyRound className="h-7 w-7" />
          </motion.div>
          <span className="mt-4 block text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/90">
            Security Transmission
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-normal tracking-tight text-text font-display">
            Recover Secret Key
          </h1>
          <p className="mt-2 text-xs text-muted font-light">
            Enter your cosmic address to receive a secure recovery transmission
          </p>
        </div>

        {/* Success Confirmation View */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-text">Transmission Dispatched</h3>
              <p className="text-xs text-muted leading-relaxed">
                If an account matches <span className="text-amber-400 font-mono">{email}</span>, a secure recovery link with 1-hour validity has been sent to your inbox.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key={error}
                  id="forgot-password-error"
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
                  htmlFor="forgot-email"
                  className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5"
                >
                  Cosmic address (Email)
                </label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-amber-400" />
                  <input
                    id="forgot-email"
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

              <motion.button
                id="forgot-submit"
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-xs font-mono uppercase tracking-wider font-semibold shadow-lg transition-all duration-300 cursor-pointer focus:outline-none star-glow-amber bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Transmitting signal...</span>
                  </motion.div>
                ) : (
                  <>
                    <span>Send Reset Transmission</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-muted font-light">
              Remember your secret key?{" "}
              <Link
                id="link-back-to-login"
                href="/login"
                className="font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4 transition"
              >
                Return to orbit
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
