"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteCapsuleButtonProps {
  capsuleId: string;
  capsuleTitle?: string;
  className?: string;
}

export default function DeleteCapsuleButton({
  capsuleId,
  capsuleTitle = "this capsule",
  className = "",
}: DeleteCapsuleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/capsules/${capsuleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete capsule.");
      }

      setIsOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Delete this capsule"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-mono text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition cursor-pointer ${className}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete Capsule</span>
      </button>

      {/* Confirmation Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl relative overflow-hidden space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="font-display text-lg font-bold text-text">
                  Permanently Delete Capsule?
                </h3>
                <p className="text-xs font-mono text-muted">This action is irreversible.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-text/80 leading-relaxed font-light">
              Are you sure you want to delete <strong className="text-text font-semibold">&ldquo;{capsuleTitle}&rdquo;</strong>? This will permanently erase the capsule and all associated photographic and audio relics from secure private storage.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-border text-xs font-mono text-muted hover:text-text hover:bg-border/30 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Purging Assets...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
