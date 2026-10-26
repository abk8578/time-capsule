"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  Upload,
  X,
  Image as ImageIcon,
  Check,
  Feather,
  Globe,
  Calendar,
  Save,
  Mail,
} from "lucide-react";
import AudioAttachment from "@/components/capsules/AudioAttachment";

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function NewCapsulePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const draftKey = userId ? `time_capsule_draft_v1:${userId}` : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [unlockDateLocal, setUnlockDateLocal] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [userTimeZone, setUserTimeZone] = useState("UTC");
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRitualSealed, setIsRitualSealed] = useState(false);
  const [draftRestoredToast, setDraftRestoredToast] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      // Detect user's local timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setUserTimeZone(tz);
      } catch {
        setUserTimeZone("Local Time");
      }

      // Set minimum date/time to 2 minutes from now formatted for datetime-local
      const now = new Date(Date.now() + 2 * 60 * 1000);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const minString = `${year}-${month}-${day}T${hours}:${minutes}`;

      setMinDateTime(minString);
      // Default initial value to 1 year from now
      const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const tYear = nextYear.getFullYear();
      const tMonth = String(nextYear.getMonth() + 1).padStart(2, "0");
      const tDay = String(nextYear.getDate()).padStart(2, "0");
      const tHours = String(nextYear.getHours()).padStart(2, "0");
      const tMinutes = String(nextYear.getMinutes()).padStart(2, "0");
      setUnlockDateLocal(`${tYear}-${tMonth}-${tDay}T${tHours}:${tMinutes}`);
    }, 0);

    return () => clearTimeout(initTimer);
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [selectedFiles]);

  // 1. Restore draft when user-specific draftKey is ready (Rule: only title and content)
  useEffect(() => {
    if (!draftKey) return;

    let dismissTimer: NodeJS.Timeout;
    const restoreTimer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.title || parsed?.content) {
            if (parsed.title) setTitle(parsed.title);
            if (parsed.content) setContent(parsed.content);
            setHasDraft(true);
            setDraftRestoredToast(true);
            dismissTimer = setTimeout(() => setDraftRestoredToast(false), 4500);
          }
        }
      } catch {
        // Graceful fallback if localStorage is disabled or corrupt
      }
    }, 0);

    return () => {
      clearTimeout(restoreTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [draftKey]);

  // 2. Autosave title and content every 5 seconds to localStorage
  // Rule: User-specific key; save ONLY title and content (no recipient email or media);
  // and empty title+content par save na ho (removes existing draft if any).
  useEffect(() => {
    if (!draftKey) return;

    const timer = setInterval(() => {
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();

      if (trimmedTitle.length > 0 || trimmedContent.length > 0) {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              title: trimmedTitle,
              content: trimmedContent,
              savedAt: Date.now(),
            })
          );
          setHasDraft(true);
          setLastSavedTime(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        } catch {
          // LocalStorage quota or access error handling
        }
      } else {
        // If both title and content are empty, do NOT save and remove any existing draft
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Safe error catch
        }
        setHasDraft(false);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [draftKey, title, content]);

  const handleClearDraft = () => {
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Safe error catch
      }
    }
    setTitle("");
    setContent("");
    setHasDraft(false);
    setLastSavedTime(null);
  };

  const wordCount =
    content.trim().length > 0
      ? content.trim().split(/\s+/).filter(Boolean).length
      : 0;

  // Preset celestial alignment helpers
  const applyPreset = (daysFromNow: number) => {
    const target = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    const yr = target.getFullYear();
    const mo = String(target.getMonth() + 1).padStart(2, "0");
    const da = String(target.getDate()).padStart(2, "0");
    const hr = String(target.getHours()).padStart(2, "0");
    const mi = String(target.getMinutes()).padStart(2, "0");
    setUnlockDateLocal(`${yr}-${mo}-${da}T${hr}:${mi}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const incoming = Array.from(e.target.files);
    const totalCount = selectedFiles.length + incoming.length;

    if (totalCount > 5) {
      setError("You can attach a maximum of 5 images per capsule.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    const newItems: FileWithPreview[] = [];
    for (const file of incoming) {
      if (!validTypes.includes(file.type)) {
        setError(`"${file.name}" is not a valid format. Only JPEG, PNG, and WebP are allowed.`);
        return;
      }
      if (file.size > maxSize) {
        setError(`"${file.name}" exceeds the 5 MB limit.`);
        return;
      }
      newItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setSelectedFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please provide a title for your star capsule.");
      return;
    }
    if (trimmedTitle.length > 100) {
      setError("Title cannot exceed 100 characters.");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Please write your message to your future self.");
      return;
    }
    if (content.length > 10000) {
      setError("Message cannot exceed 10,000 characters.");
      return;
    }

    if (!unlockDateLocal) {
      setError("Please choose a future unlock date and time.");
      return;
    }

    const chosenDate = new Date(unlockDateLocal);
    if (isNaN(chosenDate.getTime())) {
      setError("Please select a valid date and time.");
      return;
    }

    const minAllowedTime = Date.now() + 60 * 1000;
    if (chosenDate.getTime() < minAllowedTime) {
      setError("Unlock date must be at least 1 minute in the future.");
      return;
    }

    const trimmedRecipient = recipientEmail.trim();
    if (trimmedRecipient) {
      if (trimmedRecipient.length > 254) {
        setError("Recipient email cannot exceed 254 characters.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipient)) {
        setError("Please provide a valid recipient email address (or leave it blank).");
        return;
      }
    }

    const unlockAtUTC = chosenDate.toISOString();
    setLoading(true);
    setStatusMessage("Gathering cosmic fragments...");

    try {
      const uploadedKeys: string[] = [];
      let uploadedAudioKey: string | undefined = undefined;

      // Step 1: Upload images directly to Supabase Storage if any
      if (selectedFiles.length > 0) {
        setStatusMessage("Securing photographic relics in private vault...");

        const uploadUrlRes = await fetch("/api/capsules/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: selectedFiles.map((item) => ({
              mimeType: item.file.type,
              size: item.file.size,
              mediaType: "image",
            })),
          }),
        });

        const uploadUrlData = await uploadUrlRes.json();
        if (!uploadUrlRes.ok) {
          setError(uploadUrlData.error || "Failed to initialize image upload.");
          setLoading(false);
          setStatusMessage(null);
          return;
        }

        const { uploadUrls } = uploadUrlData;

        for (let i = 0; i < selectedFiles.length; i++) {
          const item = selectedFiles[i];
          const uploadInfo = uploadUrls[i];
          setStatusMessage(`Stowing memory ${i + 1} of ${selectedFiles.length}...`);

          const uploadRes = await fetch(uploadInfo.signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": item.file.type,
            },
            body: item.file,
          });

          if (!uploadRes.ok) {
            setError("Failed to upload images directly to private storage.");
            setLoading(false);
            setStatusMessage(null);
            return;
          }

          uploadedKeys.push(uploadInfo.key);
        }
      }

      let normalizedAudioMime: string | undefined = undefined;

      // Step 2: Upload Audio directly to Supabase Storage if attached
      if (selectedAudio) {
        setStatusMessage("Preserving voice transmission in private vault...");
        normalizedAudioMime = selectedAudio.type.split(";")[0].trim().toLowerCase() || "audio/webm";

        const uploadAudioUrlRes = await fetch("/api/capsules/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [
              {
                mimeType: normalizedAudioMime,
                size: selectedAudio.size,
                mediaType: "audio",
              },
            ],
          }),
        });

        const uploadAudioUrlData = await uploadAudioUrlRes.json();
        if (!uploadAudioUrlRes.ok) {
          setError(uploadAudioUrlData.error || "Failed to initialize audio upload.");
          setLoading(false);
          setStatusMessage(null);
          return;
        }

        const audioUploadInfo = uploadAudioUrlData.uploadUrls[0];
        const audioUploadRes = await fetch(audioUploadInfo.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": normalizedAudioMime,
          },
          body: selectedAudio,
        });

        if (!audioUploadRes.ok) {
          setError("Failed to upload audio transmission directly to private storage.");
          setLoading(false);
          setStatusMessage(null);
          return;
        }

        uploadedAudioKey = audioUploadInfo.key;
      }

      // Step 3: Seal in MongoDB
      setStatusMessage("Igniting star & sealing coordinates in space-time...");

      const res = await fetch("/api/capsules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content,
          unlockAt: unlockAtUTC,
          imageKeys: uploadedKeys,
          audioKey: uploadedAudioKey,
          audioMime: normalizedAudioMime,
          recipientEmail: trimmedRecipient || undefined,
          recipientName: recipientName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to seal capsule. Please try again.");
        setLoading(false);
        setStatusMessage(null);
        return;
      }

      setIsRitualSealed(true);
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Safe draft cleanup
        }
      }
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1600);
    } catch {
      setError("An unexpected cosmic error occurred while sealing your capsule.");
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Ambient background bloom */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl rounded-full" />

      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Constellation</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          <span>The Ritual</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-semibold block mb-1">
          Act II · The Inscription
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 dark:text-white leading-[1.1]">
          Inscribe a Star in Time
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
          Write quietly. Once coordinates are locked and the seal is cast, these words vanish into darkness until the dawn of your chosen date.
        </p>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            id="capsule-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 p-4 text-xs font-medium text-rose-700 dark:text-rose-300 shadow-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Draft Autosave Status & Clear Option */}
      {hasDraft && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-2 text-muted">
            <Save className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              Draft auto-saved{lastSavedTime ? ` (${lastSavedTime})` : ""}
            </span>
          </div>
          <button
            type="button"
            id="clear-draft-btn"
            onClick={handleClearDraft}
            className="text-[11px] font-mono text-muted hover:text-rose-500 transition px-3 py-1 rounded-xl border border-border bg-card/60 hover:border-rose-500/30 cursor-pointer"
            title="Clear saved draft from this browser"
          >
            Clear draft (shared PC)
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =========================================================
            FIELD 1: CAPSULE TITLE
            ========================================================= */}
        <div className="rounded-2xl border border-stone-300 dark:border-white/15 bg-white dark:bg-[#080D1A] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="capsule-title"
              className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200"
            >
              Capsule Name / Horizon Title <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              {title.length}/100
            </span>
          </div>
          <input
            id="capsule-title"
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., A Letter to the Person I Will Become..."
            className="w-full bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/15 rounded-xl px-4 py-3 text-base font-medium text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* =========================================================
            FIELD 2: UNLOCK DATE & TIME (TEMPORAL ALIGNMENT COORDINATES)
            ========================================================= */}
        <div className="rounded-2xl border-2 border-amber-500/40 dark:border-amber-400/30 bg-amber-50/50 dark:bg-[#0c1222] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <label
                  htmlFor="capsule-unlock-date"
                  className="text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-amber-300 block"
                >
                  Unlock Date & Time Coordinates <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">
                  Exact future moment when this capsule unlocks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-white/10 border border-stone-200 dark:border-white/10 px-2.5 py-1 rounded-lg">
              <Globe className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span>Timezone: <strong className="text-amber-700 dark:text-amber-300">{userTimeZone}</strong></span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2 font-medium">
              Quick Temporal Horizons:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/15 transition cursor-pointer text-xs font-medium text-stone-800 dark:text-stone-200"
              >
                <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>+30 Days (1 Moon)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(180)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/15 transition cursor-pointer text-xs font-medium text-stone-800 dark:text-stone-200"
              >
                <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>+6 Months</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(365)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/15 transition cursor-pointer text-xs font-medium text-stone-800 dark:text-stone-200"
              >
                <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>+1 Year (Solar Orbit)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(365 * 5)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/15 transition cursor-pointer text-xs font-medium text-stone-800 dark:text-stone-200"
              >
                <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>+5 Years (Deep Void)</span>
              </button>
            </div>
          </div>

          {/* Date Picker Input */}
          <div>
            <div className="relative">
              <input
                id="capsule-unlock-date"
                type="datetime-local"
                required
                min={minDateTime}
                value={unlockDateLocal}
                onChange={(e) => setUnlockDateLocal(e.target.value)}
                className="w-full bg-white dark:bg-white/10 border-2 border-amber-500/50 dark:border-amber-400/40 rounded-xl px-4 py-3 text-sm font-mono font-semibold text-stone-900 dark:text-white outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 shadow-xs"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-stone-600 dark:text-stone-400 font-mono flex items-center gap-1">
              <span>🔒 Sealed strictly until this exact local timestamp passes the server clock.</span>
            </p>
          </div>
        </div>

        {/* =========================================================
            FIELD 3: MESSAGE TO FUTURE SELF (QUIET INSCRIPTION)
            ========================================================= */}
        <div className="rounded-2xl border border-stone-300 dark:border-white/15 bg-white dark:bg-[#080D1A] p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Feather className="h-3.5 w-3.5" />
              </div>
              <label
                htmlFor="capsule-content"
                className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200"
              >
                Message to Your Future Self <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-300">{wordCount} words</span>
              <span>·</span>
              <span className={content.length > 9500 ? "text-amber-600 font-bold" : ""}>
                {content.length.toLocaleString()}/10,000 chars
              </span>
            </div>
          </div>

          <textarea
            id="capsule-content"
            required
            rows={8}
            maxLength={10000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dear Future Self,&#10;&#10;Today, here is what is happening in my life... Here is what I am hoping for... Remember where you came from, and never forget..."
            className="w-full bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/15 rounded-xl p-4 text-base text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none font-sans leading-relaxed resize-y min-h-[200px] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* =========================================================
            FIELD 4: SEND TO SOMEONE ELSE (OPTIONAL RECIPIENT FLOW)
            ========================================================= */}
        <div className="rounded-2xl border border-stone-300 dark:border-white/15 bg-white dark:bg-[#080D1A] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200">
                  Send to Someone Else (Optional)
                </h3>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Zero emails sent today. They receive an access link ONLY when time arrives.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
              Recipient Delivery
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="recipient-email"
                className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 font-medium"
              >
                Recipient Email
              </label>
              <input
                id="recipient-email"
                type="email"
                maxLength={254}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@cosmos.space"
                className="w-full bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-stone-900 dark:text-white placeholder:text-stone-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="recipient-name"
                className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 font-medium"
              >
                Recipient Name (Optional)
              </label>
              <input
                id="recipient-name"
                type="text"
                maxLength={100}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Maya or Future Kid"
                className="w-full bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-stone-900 dark:text-white placeholder:text-stone-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* =========================================================
            FIELD 5: ATTACH PHOTOS (STOW PHOTOGRAPHIC RELICS)
            ========================================================= */}
        <div className="rounded-2xl border border-stone-300 dark:border-white/15 bg-white dark:bg-[#080D1A] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <ImageIcon className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200">
                  Attach Photos (Optional)
                </h3>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Stored in private storage until unlock
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300">
              {selectedFiles.length}/5 photos
            </span>
          </div>

          {/* Thumbnail Previews */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {selectedFiles.map((item, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden border border-stone-300 dark:border-white/20 aspect-square shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-stone-900/80 text-white flex items-center justify-center transition hover:bg-rose-600 cursor-pointer shadow-md"
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-1 bg-black/75 text-[10px] font-mono text-white truncate text-center">
                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button / Dropzone */}
          {selectedFiles.length < 5 && (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 dark:border-white/20 hover:border-amber-500 dark:hover:border-amber-400 rounded-xl cursor-pointer bg-stone-50 dark:bg-white/5 hover:bg-amber-50/50 dark:hover:bg-amber-400/5 transition duration-200 group">
              <Upload className="h-6 w-6 text-stone-500 dark:text-stone-400 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
              <span className="text-xs font-semibold text-stone-800 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                Click to browse or drop photos here
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
                JPEG, PNG, or WebP up to 5 MB each ({5 - selectedFiles.length} slots remaining)
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* =========================================================
            FIELD 5: VOICE NOTE / AUDIO TRANSMISSION (OPTIONAL)
            ========================================================= */}
        <AudioAttachment
          selectedAudio={selectedAudio}
          onAudioSelected={setSelectedAudio}
        />

        {/* =========================================================
            ACTIONS: SUBMIT / CANCEL
            ========================================================= */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 px-6 py-3 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition"
          >
            Cancel
          </Link>

          <button
            id="capsule-submit"
            type="submit"
            disabled={loading || isRitualSealed}
            className="w-full sm:w-auto min-w-[200px] flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-8 py-3 text-xs font-mono uppercase tracking-wider text-slate-950 font-bold shadow-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer star-glow-amber"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusMessage || "Sealing Star..."}</span>
              </>
            ) : isRitualSealed ? (
              <>
                <Check className="h-4 w-4" />
                <span>Star Sealed & Orbiting</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Seal & Save Capsule</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* The Sealing Ritual Modal Animation */}
      <AnimatePresence>
        {isRitualSealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-md mx-auto"
            >
              <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1.2],
                    opacity: [0.4, 0.9, 0.6],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-amber-400/40 rounded-full border-dashed"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 text-slate-950 shadow-2xl"
                >
                  <Sparkles className="h-7 w-7" />
                </motion.div>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-amber-200 tracking-tight">
                Star Capsule Sealed
              </h2>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.25em] text-slate-400">
                Coordinates locked into your constellation
              </p>
              <div className="mt-6 flex justify-center">
                <span className="inline-block h-1 w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast: Draft Restored */}
      <AnimatePresence>
        {draftRestoredToast && (
          <motion.div
            id="draft-restored-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-amber-500/40 bg-card/95 px-4 py-3 text-xs font-mono text-text shadow-2xl backdrop-blur-xl"
          >
            <Sparkles className="h-4 w-4 text-accent shrink-0" />
            <span>Draft restored from your last session</span>
            <button
              type="button"
              onClick={() => setDraftRestoredToast(false)}
              className="ml-2 text-muted hover:text-text cursor-pointer p-0.5 rounded hover:bg-border/40"
              aria-label="Dismiss draft restored notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
