"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  Lock,
} from "lucide-react";

interface ShareCapsuleModalProps {
  capsuleId: string;
  capsuleTitle: string;
}

export default function ShareCapsuleModal({
  capsuleId,
  capsuleTitle,
}: ShareCapsuleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [includeTitle, setIncludeTitle] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenModal = () => {
    setIsOpen(true);
    setIsLoading(true);
    setErrorMsg(null);
  };

  // Fetch current share status when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    fetch(`/api/capsules/${capsuleId}/share`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.shareToken) {
          setShareToken(data.shareToken);
          setShareUrl(data.shareUrl);
          setIncludeTitle(!!data.shareIncludeTitle);
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg("Failed to check share status.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, capsuleId]);

  const handleCreateOrUpdateShare = async (titleToggleValue?: boolean) => {
    setIsLoading(true);
    setErrorMsg(null);
    const useTitle = titleToggleValue !== undefined ? titleToggleValue : includeTitle;

    try {
      const res = await fetch(`/api/capsules/${capsuleId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeTitle: useTitle }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate share link.");
      }

      setShareToken(data.shareToken);
      setShareUrl(data.shareUrl);
      setIncludeTitle(data.shareIncludeTitle);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating share link.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!confirm("Are you sure you want to stop sharing? Anyone with the existing link will immediately lose access.")) {
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/capsules/${capsuleId}/share`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to revoke share token.");
      }

      setShareToken(null);
      setShareUrl(null);
      setIncludeTitle(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revoking share.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl || typeof navigator.share !== "function") return;
    try {
      await navigator.share({
        title: "Time Capsule",
        text: "Maine yeh likha tha — my time capsule has arrived across spacetime.",
        url: shareUrl,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-card px-5 py-3 text-sm font-semibold text-text shadow-sm hover:border-amber-400 hover:text-amber-300 transition cursor-pointer"
      >
        <Share2 className="h-4 w-4 text-amber-400" />
        <span>Share Capsule</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-card p-6 sm:p-8 shadow-2xl text-text space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Share Memory Card</h3>
                  <p className="text-xs text-muted">Generate a public card preview to share</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-muted hover:text-text hover:bg-white/5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Privacy Guarantee Note */}
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-3.5 text-xs text-muted leading-relaxed">
              <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Message Content:</strong> The public share card only shows that you wrote a message in the past and how long it traveled. Your actual letter is NEVER shared or exposed.
              </span>
            </div>

            {/* Include Title Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-bg/50">
              <label htmlFor="toggle-title" className="text-xs cursor-pointer select-none">
                <span className="font-semibold block text-text">Include Capsule Title</span>
                <span className="text-muted text-[11px] block">
                  Show &ldquo;{capsuleTitle}&rdquo; on the public card
                </span>
              </label>

              <input
                id="toggle-title"
                type="checkbox"
                checked={includeTitle}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIncludeTitle(val);
                  if (shareToken) {
                    handleCreateOrUpdateShare(val);
                  }
                }}
                className="h-4 w-4 rounded border-border text-amber-400 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            {/* Card Preview */}
            <div className="rounded-2xl border border-border/80 bg-black/40 p-4 text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Card Preview
              </span>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-b from-card to-bg space-y-1">
                <p className="font-display text-base font-bold text-text">
                  &ldquo;Maine kuch saal pehle yeh likha tha&rdquo;
                </p>
                {includeTitle && (
                  <p className="text-xs font-mono text-amber-400 italic">
                    &mdash; {capsuleTitle} &mdash;
                  </p>
                )}
                <p className="text-[10px] font-mono text-muted">
                  Time Capsule &bull; Traveled across spacetime
                </p>
              </div>
            </div>

            {/* Share Actions */}
            {shareUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-xl border border-border bg-bg/80 px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-on-accent transition hover:opacity-90 cursor-pointer"
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-text hover:border-amber-400 transition cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5 text-amber-400" />
                        <span>Share to Apps</span>
                      </button>
                    )}

                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted hover:text-text hover:border-amber-400 transition cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Preview Page</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleRevokeShare}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Stop Sharing</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleCreateOrUpdateShare()}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-on-accent shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Generate Share Link</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
