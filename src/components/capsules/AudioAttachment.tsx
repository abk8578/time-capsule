"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Upload,
  Music,
  AlertCircle,
  Volume2,
} from "lucide-react";

interface AudioAttachmentProps {
  onAudioSelected: (file: File | null) => void;
  selectedAudio: File | null;
}

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_RECORDING_SECONDS = 300; // 5 minutes

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function AudioAttachment({
  onAudioSelected,
  selectedAudio,
}: AudioAttachmentProps) {
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused">("idle");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate or clean preview URL whenever selectedAudio changes
  useEffect(() => {
    if (!selectedAudio) {
      const timer = setTimeout(() => {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setIsPlaying(false);
        setPlaybackTime(0);
        setDuration(0);
      }, 0);
      return () => clearTimeout(timer);
    }

    const url = URL.createObjectURL(selectedAudio);
    const timer = setTimeout(() => {
      setPreviewUrl(url);
    }, 0);

    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [selectedAudio]);

  // Cleanup microphone streams and recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Stop recording helper
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecordingState("idle");
  }, []);

  // Timer runner
  useEffect(() => {
    if (recordingState === "recording") {
      timerIntervalRef.current = setInterval(() => {
        setRecordedSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            // Reached 5-minute auto-stop limit
            setTimeout(() => stopRecording(), 0);
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [recordingState, stopRecording]);

  // Detect optimal audio mime type strictly from whitelist (audio/webm for Chrome, audio/mp4 for Safari/iOS)
  const getOptimalMimeType = (): { mimeType: "audio/webm" | "audio/mp4"; extension: "webm" | "m4a" } => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return { mimeType: "audio/webm", extension: "webm" };
    }

    // Safari & iOS preferred
    if (MediaRecorder.isTypeSupported("audio/mp4")) {
      return { mimeType: "audio/mp4", extension: "m4a" };
    }

    // Chrome, Firefox, Edge preferred
    if (
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ||
      MediaRecorder.isTypeSupported("audio/webm")
    ) {
      return { mimeType: "audio/webm", extension: "webm" };
    }

    return { mimeType: "audio/webm", extension: "webm" };
  };

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    setRecordedSeconds(0);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicError("Microphone recording is not supported in this browser environment.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mimeType, extension } = getOptimalMimeType();

      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Stop all microphone tracks immediately upon recording completion
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Normalize MIME: strip parameters (e.g. codecs=opus)
        const rawMime = recorder.mimeType || mimeType;
        const normalizedMime = rawMime.split(";")[0].trim().toLowerCase() || mimeType;
        const blob = new Blob(audioChunksRef.current, { type: normalizedMime });

        if (blob.size > MAX_AUDIO_SIZE) {
          setMicError("Voice note exceeds the 25 MB limit.");
          return;
        }

        const fileName = `voice-note-${Date.now()}.${extension}`;
        const file = new File([blob], fileName, { type: normalizedMime });
        onAudioSelected(file);
      };

      recorder.start(250); // Slice into 250ms chunks
      setRecordingState("recording");
    } catch (err: unknown) {
      console.error("[Mic Error]:", err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        setMicError("Microphone access was denied. Please allow microphone permissions in your browser or upload an audio file below.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setMicError("No microphone found. Please connect an audio input device or upload an audio file below.");
      } else {
        setMicError("Unable to access microphone. Please verify device permissions or upload an audio file below.");
      }
      setRecordingState("idle");
    }
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
    } else if (recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMicError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const whitelist = ["audio/mpeg", "audio/mp4", "audio/webm", "audio/wav"];
    const rawType = (file.type || "").split(";")[0].trim().toLowerCase();

    // Map common extensions if browser sent empty or ambiguous MIME
    let normalizedType = rawType;
    if (!whitelist.includes(normalizedType)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "mp3") normalizedType = "audio/mpeg";
      else if (ext === "m4a" || ext === "mp4") normalizedType = "audio/mp4";
      else if (ext === "webm") normalizedType = "audio/webm";
      else if (ext === "wav") normalizedType = "audio/wav";
    }

    if (!whitelist.includes(normalizedType)) {
      setMicError("Invalid audio format. Allowed: MP3, M4A, WebM, WAV.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_AUDIO_SIZE) {
      setMicError("Audio file exceeds the 25 MB size limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Ensure File object has normalized MIME type
    const normalizedFile = new File([file], file.name, { type: normalizedType });
    onAudioSelected(normalizedFile);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAudio = () => {
    onAudioSelected(null);
    setRecordedSeconds(0);
    setMicError(null);
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setPlaybackTime(audioElementRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioElementRef.current) {
      setDuration(audioElementRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setPlaybackTime(time);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-text font-semibold flex items-center gap-1.5">
              <span>Voice Note / Audio Transmission</span>
              <span className="text-[10px] text-muted font-normal">(Optional, Max 25 MB)</span>
            </h4>
          </div>
        </div>

        {/* Tab toggle: Mic or Upload */}
        {!selectedAudio && recordingState === "idle" && (
          <div className="flex items-center rounded-xl border border-border bg-card/80 p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setTab("record");
                setMicError(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                tab === "record"
                  ? "bg-amber-400/20 text-amber-300 font-semibold"
                  : "text-muted hover:text-text"
              }`}
            >
              <Mic className="h-3 w-3" />
              <span>Record</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("upload");
                setMicError(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                tab === "upload"
                  ? "bg-amber-400/20 text-amber-300 font-semibold"
                  : "text-muted hover:text-text"
              }`}
            >
              <Upload className="h-3 w-3" />
              <span>Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Banner with quick switch to upload */}
      {micError && (
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="leading-relaxed">{micError}</p>
          </div>
          {tab === "record" && (
            <button
              type="button"
              onClick={() => {
                setTab("upload");
                setMicError(null);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-mono font-semibold text-xs transition hover:brightness-110 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <Upload className="h-3 w-3" />
              <span>Upload Audio File Instead</span>
            </button>
          )}
        </div>
      )}

      {/* State 1: Active Recording in Progress */}
      {recordingState !== "idle" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <span className={`absolute h-3 w-3 rounded-full bg-rose-500 ${recordingState === "recording" ? "animate-ping" : ""}`} />
              <Mic className="h-5 w-5 relative" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
                  {recordingState === "recording" ? "Recording Voice Transmission..." : "Recording Paused"}
                </span>
              </div>
              <p className="text-xs font-mono text-muted">
                {formatTime(recordedSeconds)} / 05:00 (Max 5 min)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pauseResumeRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-mono text-text transition hover:bg-border/40 cursor-pointer"
            >
              {recordingState === "recording" ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-500 text-xs font-mono text-white font-semibold shadow transition hover:bg-rose-600 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Finish</span>
            </button>
          </div>
        </div>
      )}

      {/* State 2: Recorded / Attached Audio Playback Preview */}
      {selectedAudio && previewUrl && recordingState === "idle" && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
          <audio
            ref={audioElementRef}
            src={previewUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-bold transition hover:brightness-110 cursor-pointer shadow-md"
                aria-label={isPlaying ? "Pause playback" : "Play playback"}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <p className="text-xs font-mono font-medium text-text truncate max-w-[220px] sm:max-w-[280px]">
                    {selectedAudio.name}
                  </p>
                </div>
                <p className="text-[11px] font-mono text-muted">
                  {(selectedAudio.size / (1024 * 1024)).toFixed(2)} MB • {formatTime(Math.floor(playbackTime))} / {formatTime(Math.floor(duration || recordedSeconds))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  removeAudio();
                  startRecording();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-mono text-muted hover:text-text transition cursor-pointer"
                title="Discard and re-record"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Re-record</span>
              </button>

              <button
                type="button"
                onClick={removeAudio}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-mono text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                title="Remove audio"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Scrubbing slider */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted w-8 text-right">
              {formatTime(Math.floor(playbackTime))}
            </span>
            <input
              type="range"
              min={0}
              max={duration || recordedSeconds || 1}
              step={0.1}
              value={playbackTime}
              onChange={handleSeek}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] font-mono text-muted w-8">
              {formatTime(Math.floor(duration || recordedSeconds))}
            </span>
          </div>
        </div>
      )}

      {/* State 3: Idle - Record mode */}
      {!selectedAudio && recordingState === "idle" && tab === "record" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-dashed border-border/80 bg-card/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text">Record Voice Note directly from browser</p>
              <p className="text-[11px] font-mono text-muted">
                Max 5 minutes • Saved as high-fidelity audio (MP3/M4A/WebM)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startRecording}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow transition hover:brightness-110 cursor-pointer"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Start Recording</span>
          </button>
        </div>
      )}

      {/* State 4: Idle - Upload mode */}
      {!selectedAudio && recordingState === "idle" && tab === "upload" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-border/80 bg-card/40 hover:border-amber-400/50 hover:bg-card/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text">Select or drop an audio file</p>
              <p className="text-[11px] font-mono text-muted">
                MP3, M4A, WebM, WAV • Maximum 25 MB
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-text hover:bg-border/40 transition pointer-events-none"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Browse File</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp4,audio/webm,audio/wav,.mp3,.m4a,.mp4,.webm,.wav"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
