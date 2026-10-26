"use client";

import Link from "next/link";
import { Lock, MailOpen, ArrowRight, Calendar } from "lucide-react";
import type { CapsuleDTO } from "@/types";
import CountdownTimer from "@/components/CountdownTimer";
import LocalDateText from "@/components/LocalDateText";

interface CapsuleCardProps {
  capsule: CapsuleDTO;
}

export default function CapsuleCard({ capsule }: CapsuleCardProps) {
  const isSealed = !capsule.isUnlocked;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card/50 p-6 backdrop-blur-md shadow-md transition-all duration-300 hover:border-amber-500/40 hover:bg-card/80">
      <div>
        {/* Status Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {isSealed ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-400">
              <Lock className="h-3 w-3" />
              Sealed Orbit
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/30 bg-slate-200/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-200">
              <MailOpen className="h-3 w-3" />
              Revealed Beacon
            </span>
          )}

          {isSealed ? (
            <CountdownTimer unlockAt={capsule.unlockAt} compact />
          ) : (
            <span className="text-[11px] font-mono text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <LocalDateText
                dateString={capsule.unlockAt}
                options={{ month: "short", day: "numeric", year: "numeric" }}
              />
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-xl text-text line-clamp-2 group-hover:text-amber-300 transition-colors">
          {capsule.title}
        </h3>

        {/* Content Preview (ONLY for opened capsules) */}
        {!isSealed && capsule.content && (
          <p className="mt-3 text-xs text-muted font-light line-clamp-3 leading-relaxed">
            {capsule.content}
          </p>
        )}

        {/* Sealed Details Note */}
        {isSealed && (
          <div className="mt-4 text-xs font-mono text-muted/80">
            <span>Unlocks on </span>
            <LocalDateText
              dateString={capsule.unlockAt}
              className="text-text font-semibold"
            />
          </div>
        )}
      </div>

      {/* Card Action Link */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
          Written{" "}
          <LocalDateText
            dateString={capsule.createdAt}
            options={{ month: "short", day: "numeric", year: "numeric" }}
          />
        </span>

        <Link
          href={`/capsules/${capsule.id}`}
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 transition"
        >
          <span>{isSealed ? "Coordinates" : "Read Memory"}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
