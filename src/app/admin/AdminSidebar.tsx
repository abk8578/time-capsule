"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Archive,
  Newspaper,
  Shield,
  LogOut,
  Menu,
  X,
  Compass,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface AdminSidebarProps {
  adminEmail: string;
  adminName: string;
}

export default function AdminSidebar({
  adminEmail,
  adminName,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      name: "User Registry",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      name: "Time Capsules",
      href: "/admin/capsules",
      icon: Archive,
      active: pathname.startsWith("/admin/capsules"),
    },
    {
      name: "Newsletters",
      href: "/admin/newsletters",
      icon: Newspaper,
      active: pathname.startsWith("/admin/newsletters"),
    },
  ];

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // safe
    }

    try {
      if (typeof window !== "undefined") {
        const theme = sessionStorage.getItem("theme");
        sessionStorage.clear();
        if (theme) sessionStorage.setItem("theme", theme);
      }
    } catch {
      // safe
    }
    await signOut({ callbackUrl: "/admin/login" });
  };

  const NavContent = () => (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="space-y-6">
        {/* Brand / Title Header */}
        <div className="flex items-center gap-3 border-b border-border/80 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-lg font-bold tracking-tight text-text">
                Admin<span className="text-accent">Deck</span>
              </span>
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-accent-text border border-accent/25">
                Root
              </span>
            </div>
            <p className="text-[10px] font-mono text-muted tracking-wider uppercase">
              Time Capsule Control
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${
                  item.active
                    ? "bg-accent/15 font-semibold text-accent-text border border-accent/30 shadow-xs"
                    : "text-muted hover:bg-card hover:text-text hover:border hover:border-border"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${item.active ? "text-accent" : "text-muted"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="border-t border-border/80 pt-4 space-y-4">
        {/* Profile Info */}
        <div className="rounded-xl border border-border bg-card/60 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Operator
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-500 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified
            </span>
          </div>
          <p className="truncate text-xs font-medium text-text">{adminName}</p>
          <p className="truncate font-mono text-[11px] text-muted">{adminEmail}</p>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleAdminLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-mono text-muted transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            title="Sign out of Admin Deck"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-muted hover:text-text transition-colors"
          >
            <Compass className="h-3 w-3" />
            <span>Go to Public Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-slate-950 font-bold">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-display text-base font-bold text-text">
            Admin<span className="text-accent">Deck</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text"
            aria-label="Toggle admin sidebar"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-bg shadow-2xl">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-2xl md:flex fixed left-0 top-0 z-30">
        <NavContent />
      </aside>
    </>
  );
}
