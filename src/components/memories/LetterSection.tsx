"use client";

import { motion } from "motion/react";
import { Mail, Feather } from "lucide-react";

interface LetterSectionProps {
  content: string;
}

export default function LetterSection({ content }: LetterSectionProps) {
  // Split into distinct paragraphs while maintaining line breaks inside
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="relative py-20 px-4 sm:px-8 max-w-3xl mx-auto w-full">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-text mb-3">
          <Feather className="h-4 w-4" />
          <span>The Letter</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
          Words Across Time
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted">
          Written by you, preserved in isolation until today.
        </p>
      </motion.div>

      {/* Paragraph by paragraph reveal */}
      <div className="space-y-8">
        {paragraphs.map((paragraph, index) => {
          const lines = paragraph.split("\n");
          const firstLine = lines[0] || "";
          const remainingLines = lines.slice(1).join("\n");

          const words = firstLine.split(" ");
          // Highlight first 3 words (or fewer if total words < 3)
          const highlightCount = Math.min(3, words.length);
          const highlightedWords = words.slice(0, highlightCount).join(" ");
          const restOfFirstLine = words.slice(highlightCount).join(" ");

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{
                duration: 0.75,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="relative p-6 sm:p-10 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm transition-all hover:border-accent/50"
            >
              {/* Subtle decorative quote indicator on first paragraph */}
              {index === 0 && (
                <div className="absolute -top-3.5 left-6 px-2.5 py-0.5 rounded-full border border-accent/40 bg-card text-[11px] font-semibold text-accent-text flex items-center gap-1.5 shadow-sm">
                  <Mail className="h-3 w-3" />
                  <span>Beginning of message</span>
                </div>
              )}

              <div className="whitespace-pre-wrap font-sans text-base sm:text-lg text-text leading-relaxed sm:leading-loose">
                {/* First line with accent highlight on first few words */}
                <div>
                  <motion.span
                    initial={{
                      backgroundColor: "rgba(242, 184, 75, 0)",
                      color: "inherit",
                    }}
                    whileInView={{
                      backgroundColor: "rgba(242, 184, 75, 0.24)",
                      color: "var(--color-accent-text)",
                    }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="rounded-md px-1.5 py-0.5 font-semibold inline-block mr-1"
                  >
                    {highlightedWords}
                  </motion.span>
                  <span>{restOfFirstLine}</span>
                </div>

                {/* Remaining lines of this paragraph with preserved line breaks */}
                {remainingLines && (
                  <div className="mt-2">
                    {remainingLines}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
