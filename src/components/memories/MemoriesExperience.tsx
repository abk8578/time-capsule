"use client";

import { useEffect } from "react";
import Link from "next/link";
import Lenis from "lenis";
import { ArrowLeft, ArrowUp, Sparkles } from "lucide-react";
import HeroSection from "./HeroSection";
import TimeTravelledSection from "./TimeTravelledSection";
import LetterSection from "./LetterSection";
import PhotosSection from "./PhotosSection";
import SnapshotCard from "./SnapshotCard";
import AudioRelicSection from "./AudioRelicSection";
import ListenButton from "./ListenButton";
import DeleteCapsuleButton from "@/components/capsules/DeleteCapsuleButton";
import ShareCapsuleModal from "@/components/capsules/ShareCapsuleModal";

export interface MemoriesExperienceProps {
  capsuleId?: string;
  title: string;
  content: string;
  createdAtIso: string;
  openedAtIso: string;
  createdAtFormatted: string;
  openedAtFormatted: string;
  isOpenedToday?: boolean;
  signedImages?: { url: string; mimeType: string }[];
  signedMedia?: {
    url: string;
    mimeType: string;
    mediaType: "audio" | "video";
    duration?: number;
  } | null;
  isOwner?: boolean;
  refreshEndpoint?: string;
  snapshot?: Record<string, unknown> | null;
}

export default function MemoriesExperience({
  capsuleId,
  title,
  content,
  createdAtIso,
  openedAtIso,
  createdAtFormatted,
  openedAtFormatted,
  isOpenedToday = true,
  signedImages = [],
  signedMedia = null,
  isOwner = true,
  refreshEndpoint,
  snapshot = null,
}: MemoriesExperienceProps) {
  // 1. Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-bg text-text selection:bg-accent/30 selection:text-accent-text">
      {/* 1. Full-screen Hero: Fraunces letter-by-letter reveal + dust particles + bobs */}
      <HeroSection
        title={title}
        createdAtFormatted={createdAtFormatted}
        openedAtFormatted={openedAtFormatted}
        isOpenedToday={isOpenedToday}
      />

      {/* 2. Time Travelled: Big counter (count up from 0 to days) + self-drawing SVG timeline */}
      <TimeTravelledSection
        createdAtIso={createdAtIso}
        openedAtIso={openedAtIso}
        createdAtFormatted={createdAtFormatted}
        openedAtFormatted={openedAtFormatted}
      />

      {/* Snapshot Atmosphere (if present) */}
      <SnapshotCard snapshot={snapshot} />

      {/* 3. The Letter: paragraph-by-paragraph fade & rise + first line accent highlight */}
      <LetterSection content={content} />

      {/* Text-To-Speech Listen Bar (Web Speech API) */}
      <ListenButton content={content} />

      {/* Preserved Audio Relic (if attached) */}
      <AudioRelicSection
        signedMedia={signedMedia}
        capsuleId={capsuleId}
        refreshEndpoint={refreshEndpoint}
      />

      {/* Preserved Photographs Gallery (if attached) */}
      <PhotosSection signedImages={signedImages} />

      {/* Concluding Footer of the Scroll Story */}
      <footer className="relative py-24 px-4 sm:px-8 max-w-2xl mx-auto w-full text-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="h-px w-24 bg-border/80" />

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent-text" />
            <span>Memory Preserved Forever</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {isOwner ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-md transition hover:opacity-90 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-md transition hover:opacity-90 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create Your Own Capsule</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text shadow-sm hover:border-accent transition cursor-pointer"
            >
              <ArrowUp className="h-4 w-4 text-accent-text" />
              <span>Return to Top</span>
            </button>

            {isOwner && capsuleId && (
              <>
                <ShareCapsuleModal
                  capsuleId={capsuleId}
                  capsuleTitle={title}
                />
                <DeleteCapsuleButton
                  capsuleId={capsuleId}
                  capsuleTitle={title}
                  className="py-3 px-5 text-sm"
                />
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
