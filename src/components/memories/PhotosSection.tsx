"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, X, Maximize2 } from "lucide-react";

interface PhotosSectionProps {
  signedImages: { url: string; mimeType: string }[];
}

export default function PhotosSection({ signedImages }: PhotosSectionProps) {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  if (!signedImages || signedImages.length === 0) return null;

  return (
    <section className="relative py-16 px-4 sm:px-8 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-text mb-3">
          <ImageIcon className="h-4 w-4" />
          <span>Visual Memories</span>
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-text">
          Preserved Photographs ({signedImages.length})
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted">
          Captured and sealed alongside your words.
        </p>
      </motion.div>

      {/* Grid of Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {signedImages.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              delay: idx * 0.1,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            onClick={() => setActivePreview(img.url)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:border-accent transition-all duration-300 aspect-[4/3]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={`Preserved capsule moment ${idx + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Enlarge</span>
              </span>
              <span className="text-[11px] text-slate-300">#{idx + 1}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-rose-600 transition"
                aria-label="Close photo preview"
              >
                <X className="h-5 w-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePreview}
                alt="Enlarged photo view"
                className="max-h-[85vh] w-auto max-w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
