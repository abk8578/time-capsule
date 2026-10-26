"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Sparkles, Radio, Loader2 } from "lucide-react";

interface AudioRelicSectionProps {
  signedMedia?: {
    url: string;
    mimeType: string;
    mediaType: "audio" | "video";
    duration?: number;
  } | null;
  capsuleId?: string;
  refreshEndpoint?: string;
}

function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || !Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function AudioRelicSection({
  signedMedia,
  capsuleId,
  refreshEndpoint,
}: AudioRelicSectionProps) {
  const [currentUrl, setCurrentUrl] = useState(signedMedia?.url || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(signedMedia?.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRefreshingRef = useRef(false);

  const [prevMediaUrl, setPrevMediaUrl] = useState(signedMedia?.url || "");
  if (signedMedia?.url && signedMedia.url !== prevMediaUrl) {
    setPrevMediaUrl(signedMedia.url);
    setCurrentUrl(signedMedia.url);
    if (signedMedia.duration && Number.isFinite(signedMedia.duration)) {
      setDuration(signedMedia.duration);
    }
  }

  // Mutual exclusivity: Pause audio when Listen (TTS) starts playing
  useEffect(() => {
    const handleListenPlay = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("capsule-listen-play", handleListenPlay);
    return () => {
      window.removeEventListener("capsule-listen-play", handleListenPlay);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const refreshSignedUrl = useCallback(async (): Promise<string | null> => {
    const endpoint =
      refreshEndpoint || (capsuleId ? `/api/capsules/${capsuleId}/media-url` : null);
    if (!endpoint || isRefreshingRef.current) return null;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to refresh audio stream URL");
      const data = await res.json();
      if (data?.signedUrl) {
        setCurrentUrl(data.signedUrl);
        return data.signedUrl as string;
      }
      return null;
    } catch (err) {
      console.error("[AudioRelic] Failed to refresh stream:", err);
      return null;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [capsuleId, refreshEndpoint]);

  if (!signedMedia || signedMedia.mediaType !== "audio" || !currentUrl) {
    return null;
  }

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Mutual exclusivity: signal Listen (TTS) to pause
      window.dispatchEvent(new CustomEvent("capsule-audio-play"));

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Play failed (possible token expired), attempt auto-refresh
        const freshUrl = await refreshSignedUrl();
        if (freshUrl && audioRef.current) {
          audioRef.current.src = freshUrl;
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch {
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  const handleAudioError = async () => {
    const freshUrl = await refreshSignedUrl();
    if (freshUrl && audioRef.current) {
      const resumeTime = currentTime;
      audioRef.current.src = freshUrl;
      audioRef.current.currentTime = resumeTime;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // WebM recordings from MediaRecorder often have duration: Infinity or NaN
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const rawDur = audioRef.current.duration;

    if (rawDur === Infinity || isNaN(rawDur)) {
      // Seek hack to force browser to calculate WebM duration
      const audio = audioRef.current;
      audio.currentTime = 1e101;
      const onTimeUpdate = () => {
        audio.removeEventListener("timeupdate", onTimeUpdate);
        const resolved = audio.duration;
        audio.currentTime = 0;
        setCurrentTime(0);
        if (Number.isFinite(resolved) && resolved > 0) {
          setDuration(resolved);
        } else if (signedMedia?.duration && Number.isFinite(signedMedia.duration)) {
          setDuration(signedMedia.duration);
        }
      };
      audio.addEventListener("timeupdate", onTimeUpdate);
    } else if (Number.isFinite(rawDur) && rawDur > 0) {
      setDuration(rawDur);
    } else if (signedMedia?.duration && Number.isFinite(signedMedia.duration)) {
      setDuration(signedMedia.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const hasFiniteDuration = Number.isFinite(duration) && duration > 0;

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-card/90 via-card/60 to-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Glow behind the player */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

        <audio
          ref={audioRef}
          src={currentUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-md">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/90 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Starlight Audio Relic</span>
                </span>
                <h3 className="font-display text-lg sm:text-xl text-text font-normal">
                  A Voice From Across Time
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRefreshing ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Refreshing stream...</span>
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[11px] font-mono text-muted">
                  15-min ephemeral stream
                </span>
              )}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute voice note" : "Mute voice note"}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Sound wave visualizer mock */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-12 px-4 py-2 rounded-2xl bg-black/20 border border-border/40">
            {[40, 65, 30, 85, 95, 45, 70, 100, 60, 35, 75, 90, 50, 80, 65, 40, 85, 95, 30, 60, 75, 45, 90, 35, 60].map(
              (height, idx) => (
                <div
                  key={idx}
                  style={{
                    height: isPlaying ? `${Math.max(15, (height * (0.4 + (idx % 3) * 0.3)))}%` : "20%",
                    transition: "height 0.2s ease-in-out",
                  }}
                  className={`w-1 sm:w-1.5 rounded-full ${
                    isPlaying
                      ? "bg-gradient-to-t from-amber-500 to-amber-300 animate-pulse"
                      : "bg-muted/40"
                  }`}
                />
              )
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer star-glow-amber"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-1" />
                )}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={hasFiniteDuration ? duration : 1}
                  step={0.1}
                  value={hasFiniteDuration ? currentTime : 0}
                  onChange={handleSeek}
                  disabled={!hasFiniteDuration}
                  aria-label="Seek audio track"
                  className={`w-full h-2 bg-border rounded-lg appearance-none accent-amber-400 ${
                    hasFiniteDuration ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                />
                <div className="flex items-center justify-between text-xs font-mono text-muted mt-1.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{hasFiniteDuration ? formatTime(duration) : "Audio Stream"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
