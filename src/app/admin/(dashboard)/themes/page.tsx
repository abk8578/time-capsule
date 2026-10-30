"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Palette,
  Sparkles,
  Calendar,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  Flame,
  Snowflake,
  Orbit,
} from "lucide-react";
import {
  getSeasonalThemeByDate,
  resolveSeasonalTheme,
  ALLOWED_SEASONAL_THEMES,
} from "@/lib/seasonal-theme";
import type { SeasonalThemeType, ThemeIntensity } from "@/types";
import { SEASONAL_THEME_EVENT } from "@/components/seasonal/SeasonalThemeContext";
import SeasonalLogoDecorator from "@/components/seasonal/SeasonalLogoDecorator";
import HalloweenEffects from "@/components/seasonal/HalloweenEffects";
import DiwaliEffects from "@/components/seasonal/DiwaliEffects";
import ChristmasEffects from "@/components/seasonal/ChristmasEffects";

export default function AdminThemesPage() {
  // Stored / Form state
  const [autoByDate, setAutoByDate] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<SeasonalThemeType>("default");
  const [intensity, setIntensity] = useState<ThemeIntensity>(2);

  // Simulation date for testing in preview
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);

  // Status & loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch current settings from backend
  const fetchSettings = async () => {
    setInitialLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/theme");
      if (!res.ok) {
        throw new Error("Failed to load theme settings from server.");
      }
      const data = await res.json();
      if (data?.settings) {
        setAutoByDate(Boolean(data.settings.auto));
        setSelectedTheme(data.settings.theme || "default");
        setIntensity(data.settings.intensity || 2);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to load theme settings.");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/theme");
        if (!res.ok) {
          throw new Error("Failed to load theme settings from server.");
        }
        const data = await res.json();
        if (data?.settings && isMounted) {
          setAutoByDate(Boolean(data.settings.auto));
          setSelectedTheme(data.settings.theme || "default");
          setIntensity(data.settings.intensity || 2);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setActionError(err instanceof Error ? err.message : "Failed to load theme settings.");
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute what active theme would be under current settings (or simulated date)
  const activeDate = simulatedDate || new Date();
  const dateTheme = useMemo(
    () => getSeasonalThemeByDate(activeDate),
    [activeDate]
  );

  const previewActiveTheme: SeasonalThemeType = autoByDate
    ? dateTheme
    : selectedTheme;

  // Publish changes to backend
  const handlePublish = async () => {
    setSaving(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const payload = {
        auto: autoByDate,
        season: selectedTheme,
        theme: selectedTheme,
        intensity,
      };

      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish theme settings.");
      }

      setActionSuccess("Seasonal settings published successfully!");

      // Dispatch event to update any active listeners in the current window
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SEASONAL_THEME_EVENT));
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to publish theme settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-mono text-accent-text mb-2">
            <Palette className="h-3.5 w-3.5 text-accent" />
            <span>Seasonal Atmosphere Control</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Seasonal Themes
          </h1>
          <p className="mt-1 text-sm text-muted font-light">
            Automate holiday atmospheric transitions by date, or choose a manual theme override with custom particle intensity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          disabled={initialLoading || saving}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-mono text-muted hover:text-text hover:border-accent transition disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${initialLoading ? "animate-spin text-accent" : ""}`} />
          <span>Reload Server State</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Two-Column Grid: Left Controls, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Auto by Date Toggle */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-7 backdrop-blur-xl shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-base font-bold text-text">
                    Auto by Date Scheduling
                  </h3>
                </div>
                <p className="text-xs text-muted">
                  Automatically switch site theme according to holiday calendar dates without redeployment.
                </p>
              </div>

              {/* iOS-style toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={autoByDate}
                onClick={() => setAutoByDate(!autoByDate)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoByDate ? "bg-accent" : "bg-border/80"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                    autoByDate ? "translate-x-6 bg-slate-950" : "translate-x-0 bg-muted"
                  }`}
                />
              </button>
            </div>

            {/* Date Schedule Breakdown */}
            <div className="rounded-2xl border border-border/80 bg-bg/50 p-4 space-y-2.5 text-xs font-mono">
              <div className="text-[11px] uppercase tracking-wider text-muted font-bold flex items-center justify-between">
                <span>Calendar Date Windows</span>
                <span className="text-accent">
                  {autoByDate ? "Auto Scheduler Active" : "Auto Scheduler Paused"}
                </span>
              </div>
              <ul className="space-y-2 text-muted">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text">
                    <span className="text-base">🎃</span>
                    <strong className="text-orange-400">Halloween:</strong> Oct 25 – Nov 1
                  </span>
                  <span className="text-[10px] text-muted">Dark purple & orange bats</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text">
                    <span className="text-base">🪔</span>
                    <strong className="text-amber-400">Diwali:</strong> Nov 2 – Nov 15
                  </span>
                  <span className="text-[10px] text-muted">Golden amber, diya & fireworks</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text">
                    <span className="text-base">🎄</span>
                    <strong className="text-emerald-400">Christmas:</strong> Dec 15 – Dec 26
                  </span>
                  <span className="text-[10px] text-muted">Dark green & snow / sleigh</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text">
                    <span className="text-base">🌌</span>
                    <strong>Otherwise:</strong> Default
                  </span>
                  <span className="text-[10px] text-muted">Cosmic Obsidian & Amber</span>
                </li>
              </ul>

              {/* Current Date Status Indicator */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="text-muted">
                  Server Date ({new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}):
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold uppercase text-accent-text">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Resolves to {getSeasonalThemeByDate(new Date())}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Manual Theme Selection (Active when Auto is OFF) */}
          <div
            className={`rounded-3xl border border-border bg-card/60 p-6 sm:p-7 backdrop-blur-xl shadow-xs space-y-4 transition-opacity ${
              autoByDate ? "opacity-75" : "opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                  <Palette className="h-4 w-4 text-accent" />
                  <span>Manual Theme Selection</span>
                </h3>
                <p className="text-xs text-muted">
                  {autoByDate
                    ? "Currently overridden by Auto Schedule. Turn Auto OFF to force a specific theme."
                    : "Select which theme will be displayed across the entire public website."}
                </p>
              </div>
              {!autoByDate && (
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-mono text-accent-text font-bold border border-accent/25">
                  Manual Active
                </span>
              )}
            </div>

            {/* 4 Theme Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Default Theme Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("default");
                  setAutoByDate(false);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedTheme === "default" && !autoByDate
                    ? "border-amber-400 bg-amber-500/10 shadow-sm"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-lg">🌌</span>
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full bg-[#07090E] border border-white/20" title="Background" />
                    <span className="h-3 w-3 rounded-full bg-[#F59E0B]" title="Accent" />
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-text">Default</span>
                <span className="text-[10px] font-mono text-muted mt-1">Cosmic Obsidian & Amber Gold</span>
              </button>

              {/* Halloween Theme Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("halloween");
                  setAutoByDate(false);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedTheme === "halloween" && !autoByDate
                    ? "border-orange-500 bg-orange-500/10 shadow-sm"
                    : "border-border bg-card hover:border-orange-500/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-lg">🎃</span>
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full bg-[#140B1F] border border-orange-500/40" title="Background #140b1f" />
                    <span className="h-3 w-3 rounded-full bg-[#FF7A1A]" title="Accent #ff7a1a" />
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-orange-400">Halloween</span>
                <span className="text-[10px] font-mono text-muted mt-1">Dark Purple & Flying Bats</span>
              </button>

              {/* Diwali Theme Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("diwali");
                  setAutoByDate(false);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedTheme === "diwali" && !autoByDate
                    ? "border-amber-400 bg-amber-500/15 shadow-sm"
                    : "border-border bg-card hover:border-amber-400/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-lg">🪔</span>
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full bg-[#130621] border border-amber-400/40" title="Background #130621" />
                    <span className="h-3 w-3 rounded-full bg-[#FFB703]" title="Accent #ffb703" />
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-amber-400">Diwali</span>
                <span className="text-[10px] font-mono text-muted mt-1">Royal Night, Diya & Fireworks</span>
              </button>

              {/* Christmas Theme Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("christmas");
                  setAutoByDate(false);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedTheme === "christmas" && !autoByDate
                    ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                    : "border-border bg-card hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-lg">🎄</span>
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full bg-[#0D2A1F] border border-emerald-500/40" title="Background #0d2a1f" />
                    <span className="h-3 w-3 rounded-full bg-[#E63946]" title="Accent #e63946" />
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-emerald-400">Christmas</span>
                <span className="text-[10px] font-mono text-muted mt-1">Dark Green & Snow / Sleigh</span>
              </button>
            </div>
          </div>

          {/* Card 3: Effect Intensity Slider */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-7 backdrop-blur-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-accent" />
                  <span>Effect Intensity</span>
                </h3>
                <p className="text-xs text-muted">
                  Controls the volume, density, and spawn rate of atmospheric particles.
                </p>
              </div>

              {/* Current Level Pill */}
              <span className="rounded-xl bg-accent/15 border border-accent/30 px-3 py-1 font-mono text-xs font-bold text-accent-text">
                Level {intensity} • {intensity === 1 ? "Subtle" : intensity === 2 ? "Balanced" : "Vibrant"}
              </span>
            </div>

            {/* Slider Control */}
            <div className="space-y-3 pt-2">
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value) as ThemeIntensity)}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* 3 Step Visual Indicators */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                <div
                  onClick={() => setIntensity(1)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    intensity === 1
                      ? "border-accent bg-accent/15 text-accent-text font-bold"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  <span>1. Subtle</span>
                </div>
                <div
                  onClick={() => setIntensity(2)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    intensity === 2
                      ? "border-accent bg-accent/15 text-accent-text font-bold"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  <span>2. Balanced</span>
                </div>
                <div
                  onClick={() => setIntensity(3)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    intensity === 3
                      ? "border-accent bg-accent/15 text-accent-text font-bold"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  <span>3. Vibrant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Publish */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-mono text-muted">
              Settings take effect immediately for all visitors.
            </span>

            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || initialLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-xs font-mono uppercase tracking-wider text-slate-950 font-bold shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
              <span>{saving ? "Publishing..." : "Publish Settings"}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              <span>Live Website Preview</span>
            </h3>
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
              Active: {previewActiveTheme}
            </span>
          </div>

          {/* Mock Browser Container with data-season applied */}
          <div
            data-season={previewActiveTheme}
            data-theme={previewActiveTheme}
            className="relative rounded-3xl border border-border bg-bg overflow-hidden shadow-2xl transition-all duration-300 min-h-[460px] flex flex-col"
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
            }}
          >
            {/* Embedded Seasonal Particle Effects within preview box */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-10" aria-hidden="true">
              {previewActiveTheme === "halloween" && <HalloweenEffects intensity={intensity} isContained />}
              {previewActiveTheme === "diwali" && <DiwaliEffects intensity={intensity} isContained />}
              {previewActiveTheme === "christmas" && <ChristmasEffects intensity={intensity} isContained />}
            </div>

            {/* Simulated Browser Bar */}
            <div className="flex items-center justify-between border-b border-border/80 bg-card/80 px-4 py-2.5 backdrop-blur-md relative z-20 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500/70" />
                <span className="h-2 w-2 rounded-full bg-amber-500/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
              </div>
              <div className="rounded-lg bg-bg/80 border border-border/60 px-3 py-0.5 text-muted truncate max-w-[180px]">
                timecapsule.space
              </div>
              <span className="text-[9px] uppercase font-bold text-accent-text">
                {previewActiveTheme}
              </span>
            </div>

            {/* Simulated Navigation Bar */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 relative z-20">
              <div className="flex items-center gap-2.5" id="nav-logo">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-md">
                  <Sparkles className="h-4 w-4" />
                  <SeasonalLogoDecorator overrideTheme={previewActiveTheme} />
                </div>
                <span className="font-display text-sm font-bold text-text">
                  Time<span className="text-accent">Capsule</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-14 rounded-lg bg-card border border-border" />
                <span className="h-6 w-16 rounded-lg bg-accent text-[9px] font-bold text-slate-950 flex items-center justify-center">
                  Capsule
                </span>
              </div>
            </div>

            {/* Simulated Hero & Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-center space-y-4 relative z-20">
              <div className="space-y-1.5 text-center">
                <span className="saas-badge text-[9px]">
                  {previewActiveTheme === "halloween" && "🎃 Haunted Temporal Realm"}
                  {previewActiveTheme === "diwali" && "🪔 Auspicious Festival of Lights"}
                  {previewActiveTheme === "christmas" && "🎄 Festive Holiday Constellation"}
                  {previewActiveTheme === "default" && "🌌 Cosmic Deep Space Vault"}
                </span>
                <h4 className="font-display text-xl font-bold tracking-tight text-text">
                  Letters to Your Future Self
                </h4>
                <p className="text-[11px] text-muted max-w-xs mx-auto leading-relaxed">
                  Cryptographically timelocked messages waiting across the expanse until your chosen date unlocks.
                </p>
              </div>

              {/* Sample Card */}
              <div className="saas-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-accent-text font-bold">Capsule #704-B</span>
                  <span className="text-muted">Unlocks Dec 2030</span>
                </div>
                <p className="text-xs text-text font-light leading-relaxed">
                  &ldquo;Remember who you were when you stood beneath the autumn stars...&rdquo;
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="saas-button-primary flex-1 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider text-center"
                  >
                    Ignite Star
                  </button>
                  <button
                    type="button"
                    className="saas-button-secondary flex-1 py-1.5 rounded-xl text-[10px] font-mono text-center"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Footer indicator */}
            <div className="p-3 border-t border-border/60 bg-card/40 text-center text-[10px] font-mono text-muted relative z-20">
              Theme Transition Demo • Contrast AAA Verified
            </div>
          </div>

          {/* Date Simulation Controls (to test Auto date logic) */}
          <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-2.5 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted uppercase tracking-wider text-[10px]">Date Simulation Tools</span>
              {simulatedDate && (
                <button
                  type="button"
                  onClick={() => setSimulatedDate(null)}
                  className="text-[10px] text-accent hover:underline cursor-pointer"
                >
                  Reset to Today
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setAutoByDate(true);
                  setSimulatedDate(new Date(2026, 9, 31)); // Oct 31
                }}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  autoByDate && activeDate.getMonth() === 9
                    ? "border-orange-500 bg-orange-500/15 text-orange-400 font-bold"
                    : "border-border bg-card hover:border-orange-500/40 text-muted hover:text-text"
                }`}
              >
                🎃 Oct 31 (Halloween)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoByDate(true);
                  setSimulatedDate(new Date(2026, 10, 10)); // Nov 10
                }}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  autoByDate && activeDate.getMonth() === 10
                    ? "border-amber-400 bg-amber-500/20 text-amber-400 font-bold"
                    : "border-border bg-card hover:border-amber-400/50 text-muted hover:text-amber-400"
                }`}
              >
                🪔 Nov 10 (Diwali)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoByDate(true);
                  setSimulatedDate(new Date(2026, 11, 25)); // Dec 25
                }}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  autoByDate && activeDate.getMonth() === 11
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold"
                    : "border-border bg-card hover:border-emerald-500/40 text-muted hover:text-text"
                }`}
              >
                🎄 Dec 25 (Christmas)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoByDate(true);
                  setSimulatedDate(new Date(2026, 6, 4)); // July 4
                }}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  autoByDate && activeDate.getMonth() === 6
                    ? "border-accent bg-accent/15 text-accent-text font-bold"
                    : "border-border bg-card hover:border-accent/40 text-muted hover:text-text"
                }`}
              >
                🌌 July 4 (Default)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedDate(null)}
                className={`p-2 rounded-xl border transition cursor-pointer text-center font-bold ${
                  !simulatedDate
                    ? "border-accent bg-accent/20 text-accent-text"
                    : "border-border bg-card hover:border-accent text-muted hover:text-text"
                }`}
              >
                ⏱ Live Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
