"use client";

import { motion } from "motion/react";
import { Cloud, MapPin, Compass } from "lucide-react";

interface SnapshotCardProps {
  snapshot?: {
    weather?: string;
    temperature?: string | number;
    location?: string;
    condition?: string;
    icon?: string;
    [key: string]: unknown;
  } | null;
}

export default function SnapshotCard({ snapshot }: SnapshotCardProps) {
  if (!snapshot || Object.keys(snapshot).length === 0) return null;

  return (
    <section className="relative py-12 px-4 sm:px-8 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.65 }}
        className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-sm text-center"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text mb-4">
          <Compass className="h-3.5 w-3.5" />
          <span>Atmosphere When Sealed</span>
        </div>

        <h3 className="font-display text-xl font-bold text-text mb-4">
          The World Around You
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
          {snapshot.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent-text" />
              <span className="font-medium text-text">{snapshot.location}</span>
            </div>
          )}

          {(snapshot.weather || snapshot.condition) && (
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-accent-text" />
              <span className="font-medium text-text">
                {snapshot.weather || snapshot.condition}
                {snapshot.temperature ? ` (${snapshot.temperature}°)` : ""}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
