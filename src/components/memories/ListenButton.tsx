"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  Sparkles,
  Gauge,
  Headphones,
} from "lucide-react";

interface ListenButtonProps {
  content: string;
}

/**
 * Splits text into sentence-sized chunks (~200 characters max)
 * to bypass the Chrome ~15s speechSynthesis cutoff bug and provide
 * responsive, sentence-by-sentence audiobook highlighting.
 */
function chunkTextForTTS(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Split on sentence terminators (. ! ? । \n)
  const rawSentences = text
    .replace(/([.!?।\n]+)/g, "$1|###|")
    .split("|###|")
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= 220) {
      chunks.push(sentence);
    } else {
      // Split long sentences at word boundaries near 200 chars
      const words = sentence.split(/\s+/);
      let current = "";
      for (const word of words) {
        if ((current + " " + word).trim().length > 200 && current.length > 0) {
          chunks.push(current.trim());
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      if (current.trim().length > 0) {
        chunks.push(current.trim());
      }
    }
  }
  return chunks;
}

export default function ListenButton({ content }: ListenButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [rate, setRate] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  const chunks = useMemo(() => chunkTextForTTS(content), [content]);

  // Synchronized refs to avoid stale closure state in speech callbacks
  const isPlayingRef = useRef(false);
  const statusRef = useRef<"idle" | "playing" | "paused">("idle");
  const currentChunkIndexRef = useRef(0);
  const rateRef = useRef(1.0);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const chunksRef = useRef<string[]>(chunks);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  useEffect(() => {
    statusRef.current = status;
    isPlayingRef.current = status === "playing";
  }, [status]);

  useEffect(() => {
    currentChunkIndexRef.current = currentChunkIndex;
  }, [currentChunkIndex]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  // 1. Initial browser support check & voice enumeration
  useEffect(() => {
    const timer = setTimeout(() => {
      const supported =
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        "SpeechSynthesisUtterance" in window;
      setIsSupported(supported);
    }, 0);

    const hasDevanagari = /[\u0900-\u097F]/.test(content);

    const populateVoices = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const available = window.speechSynthesis.getVoices();
      if (!available || available.length === 0) return;

      setVoices(available);

      // Determine default voice
      let defaultVoice: SpeechSynthesisVoice | undefined;
      if (hasDevanagari) {
        defaultVoice =
          available.find((v) => v.lang.toLowerCase().startsWith("hi")) ||
          available.find((v) => v.name.toLowerCase().includes("hindi")) ||
          available.find((v) => v.lang.toLowerCase().startsWith("en-in"));
      } else {
        defaultVoice =
          available.find((v) => v.lang.toLowerCase().startsWith("en-in")) ||
          available.find((v) => v.lang.toLowerCase().startsWith("en-us")) ||
          available.find((v) => v.lang.toLowerCase().startsWith("en"));
      }

      const voice = defaultVoice || available[0];
      if (voice) {
        setSelectedVoiceURI(voice.voiceURI);
        selectedVoiceRef.current = voice;
      }
    };

    populateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", populateVoices);
    }

    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.removeEventListener("voiceschanged", populateVoices);
      }
    };
  }, [content]);

  // 2. Unmount cleanup: cancel any ongoing speech immediately
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 3. Mutual exclusivity: When AudioRelic starts playing, pause Listen TTS
  useEffect(() => {
    const handleAudioPlay = () => {
      if (statusRef.current === "playing") {
        setStatus("paused");
        isPlayingRef.current = false;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      }
    };

    window.addEventListener("capsule-audio-play", handleAudioPlay);
    return () => {
      window.removeEventListener("capsule-audio-play", handleAudioPlay);
    };
  }, []);

  const speakChunkRef = useRef<((index: number) => void) | null>(null);

  // 4. Core chunk playback loop
  const speakChunk = useCallback((index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (index >= chunksRef.current.length || !isPlayingRef.current) {
      setStatus("idle");
      setCurrentChunkIndex(0);
      return;
    }

    setCurrentChunkIndex(index);
    currentChunkIndexRef.current = index;

    window.speechSynthesis.cancel();

    const textToSpeak = chunksRef.current[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    activeUtteranceRef.current = utterance;

    utterance.rate = rateRef.current;
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onend = () => {
      if (isPlayingRef.current && statusRef.current === "playing") {
        const nextIdx = index + 1;
        if (nextIdx < chunksRef.current.length) {
          speakChunkRef.current?.(nextIdx);
        } else {
          setStatus("idle");
          setCurrentChunkIndex(0);
          isPlayingRef.current = false;
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.error("[SpeechSynthesis] Chunk error:", e.error);
        setStatus("idle");
        isPlayingRef.current = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    speakChunkRef.current = speakChunk;
  }, [speakChunk]);

  // Update selected voice reference on user dropdown change
  const handleVoiceChange = (uri: string) => {
    setSelectedVoiceURI(uri);
    const chosen = voices.find((v) => v.voiceURI === uri) || null;
    selectedVoiceRef.current = chosen;

    // If currently playing, restart current chunk with new voice
    if (statusRef.current === "playing") {
      speakChunk(currentChunkIndexRef.current);
    }
  };

  // 5. Controls Handlers (Must run inside direct user click for iOS/Safari compliance)
  const handlePlay = () => {
    // Mutual exclusivity: signal AudioRelic to pause
    window.dispatchEvent(new CustomEvent("capsule-listen-play"));

    setStatus("playing");
    isPlayingRef.current = true;
    speakChunk(currentChunkIndexRef.current);
  };

  const handlePause = () => {
    setStatus("paused");
    isPlayingRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleStop = () => {
    setStatus("idle");
    isPlayingRef.current = false;
    setCurrentChunkIndex(0);
    currentChunkIndexRef.current = 0;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSpeedChange = (newRate: number) => {
    setRate(newRate);
    rateRef.current = newRate;
    // If playing, update dynamically by re-triggering current chunk at new rate
    if (statusRef.current === "playing") {
      speakChunk(currentChunkIndexRef.current);
    }
  };

  // If browser doesn't support Web Speech API or capsule has no content, hide gracefully
  if (!isSupported || chunks.length === 0) {
    return null;
  }

  const activeChunkText = chunks[currentChunkIndex] || chunks[0] || "";
  const progressPercent =
    chunks.length > 0 ? Math.round(((currentChunkIndex + 1) / chunks.length) * 100) : 0;

  return (
    <section className="relative py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-card/90 via-card/60 to-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-md">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/90 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Starlight Reader (TTS)</span>
                </span>
                <h3 className="font-display text-lg sm:text-xl text-text font-normal">
                  Listen to Words Across Time
                </h3>
              </div>
            </div>

            {/* Voice Picker Dropdown */}
            {voices.length > 0 && (
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted hidden sm:inline-block" />
                <label htmlFor="tts-voice-selector" className="sr-only">
                  Select voice
                </label>
                <select
                  id="tts-voice-selector"
                  value={selectedVoiceURI}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="max-w-[200px] sm:max-w-[240px] truncate text-xs font-mono rounded-xl border border-border bg-card/80 py-1.5 px-2.5 text-text focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Audiobook Highlighted Sentence Display */}
          <div className="relative rounded-2xl border border-amber-500/20 bg-black/25 p-4 sm:p-5">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-2">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "playing"
                      ? "bg-amber-400 animate-ping"
                      : status === "paused"
                      ? "bg-amber-400/60"
                      : "bg-muted"
                  }`}
                />
                {status === "playing"
                  ? "Speaking Sentence..."
                  : status === "paused"
                  ? "Paused"
                  : "Ready to Read"}
              </span>
              <span>
                Sentence {currentChunkIndex + 1} of {chunks.length} ({progressPercent}%)
              </span>
            </div>

            {/* Live glowing sentence text */}
            <p
              className={`text-sm sm:text-base leading-relaxed transition-all duration-300 font-sans ${
                status === "playing"
                  ? "text-amber-200 font-medium bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"
                  : "text-text/80"
              }`}
            >
              &ldquo;{activeChunkText}&rdquo;
            </p>

            {/* Micro visualizer soundwave */}
            {status === "playing" && (
              <div className="flex items-center gap-1 mt-3">
                {[30, 60, 90, 45, 80, 50, 70, 95, 40, 85, 30, 65].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${h * 0.25}px`,
                      transition: "height 0.2s ease",
                    }}
                    className="w-1 rounded-full bg-amber-400 animate-pulse"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Play, Pause, Stop Buttons */}
            <div className="flex items-center gap-3">
              {status === "playing" ? (
                <button
                  type="button"
                  onClick={handlePause}
                  aria-label="Pause narration"
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer star-glow-amber"
                >
                  <Pause className="h-5 w-5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlay}
                  aria-label={status === "paused" ? "Resume narration" : "Play narration"}
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer star-glow-amber"
                >
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleStop}
                disabled={status === "idle"}
                aria-label="Stop narration"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card/60 transition ${
                  status === "idle"
                    ? "opacity-40 cursor-not-allowed text-muted"
                    : "text-muted hover:text-text cursor-pointer hover:border-amber-400/50"
                }`}
              >
                <Square className="h-4 w-4" />
              </button>

              <div className="text-xs font-mono text-muted pl-1">
                {status === "playing" ? "Playing" : status === "paused" ? "Paused" : "Listen"}
              </div>
            </div>

            {/* Speed Slider (0.75x to 1.25x) */}
            <div className="flex items-center gap-3 sm:w-60">
              <Gauge className="h-4 w-4 text-muted shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-1">
                  <span>Speed</span>
                  <span className="text-amber-400 font-semibold">{rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={rate}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  aria-label="Speech speed rate"
                  className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
