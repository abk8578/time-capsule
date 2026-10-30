"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sparkles,
  PlusCircle,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Compass,
  Shield,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SeasonalLogoDecorator from "@/components/seasonal/SeasonalLogoDecorator";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoading = status === "loading";

  // Hide public Navbar completely on /admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Track window scroll for blur & border trigger (>10px)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        // 1. Thoroughly wipe user session data from sessionStorage while preserving theme preference
        const currentTheme = sessionStorage.getItem("theme");
        sessionStorage.clear();
        if (currentTheme) {
          sessionStorage.setItem("theme", currentTheme);
        }

        // 2. Clear client-accessible cookies (preserving theme preference)
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name && name !== "theme") {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }
    } catch {
      // Safe cleanup if storage is restricted
    }

    try {
      // 3. Clear server-side session cookies via dedicated endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore network errors
    }

    // 4. Invalidate NextAuth client session and cleanly redirect to /login
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${scrolled
        ? "border-b border-border bg-card/85 backdrop-blur-2xl shadow-xs"
        : "border-b border-transparent bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo: Cosmic Celestial Star Astrolabe */}
        <Link
          href={session ? "/dashboard" : "/"}
          id="nav-logo"
          className="group flex items-center gap-3 text-text transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-md">
            <Sparkles className="h-5 w-5" />
            <SeasonalLogoDecorator />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl tracking-tight text-text flex items-center gap-1">
              Time<span className="text-accent font-semibold">Capsule</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent ml-0.5" />
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted -mt-1 hidden sm:block">
              Galaxy Vault
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Items */}
        <div className="hidden sm:flex items-center gap-3 lg:gap-4">
          <ThemeToggle />

          {isLoading ? (
            <div className="h-8 w-24 rounded-xl bg-border/40" />
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                id="nav-dashboard"
                className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${pathname === "/dashboard"
                  ? "text-accent-text font-semibold bg-accent/15 border border-accent/30"
                  : "text-muted hover:text-text hover:bg-border/30"
                  }`}
              >
                <Compass className="h-3.5 w-3.5 text-accent" />
                <span>Constellation</span>
              </Link>

              <Link
                href="/capsules/new"
                id="nav-new-capsule"
                className="galaxy-button inline-flex min-h-[42px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-mono uppercase tracking-wider"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Ignite Star</span>
              </Link>

              <div className="flex items-center gap-2 border-l border-border pl-3 lg:pl-4">
                <div
                  title={session.user?.email || "Account"}
                  className="flex items-center gap-1.5 text-xs font-mono text-muted max-w-[140px] truncate"
                >
                  <UserIcon className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">{session.user?.name || session.user?.email}</span>
                </div>

                <button
                  type="button"
                  id="nav-logout"
                  onClick={handleSignOut}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-mono text-muted transition hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login"
                className="min-h-[40px] inline-flex items-center px-4 text-xs font-mono uppercase tracking-wider text-muted transition hover:text-text cursor-pointer"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                id="nav-signup"
                className="saas-button-primary inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-mono uppercase tracking-wider shadow-md cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Create Capsule</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions: Theme toggle + Hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-text shadow-xs transition hover:bg-border/30 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-card/95 backdrop-blur-2xl px-4 py-6 shadow-xl">
          <div className="flex flex-col gap-3">
            {session ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-border/20 border border-border text-xs text-muted mb-1">
                  <UserIcon className="h-4 w-4 text-accent" />
                  <span className="truncate font-medium text-text">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-text hover:bg-border/20 transition"
                >
                  <Compass className="h-4 w-4 text-accent" />
                  <span>Constellation Sky</span>
                </Link>

                <Link
                  href="/capsules/new"
                  className="galaxy-button flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono uppercase tracking-wider"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Ignite New Star</span>
                </Link>

                <button
                  type="button"
                  id="nav-logout-mobile"
                  onClick={handleSignOut}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-mono text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Exit Orbit (Sign Out)</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-text"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="saas-button-primary flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono uppercase tracking-wider"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Create Capsule</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
