"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Filter } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ReactNode;
  labelPrefix?: string;
  className?: string;
}

export default function AdminSelect({
  value,
  onChange,
  options,
  icon,
  labelPrefix,
  className = "",
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-xl border border-border bg-card/90 px-3.5 py-2 text-xs font-mono text-text shadow-xs transition-all hover:bg-border/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer min-w-[140px] justify-between"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 truncate">
          {icon || selectedOption?.icon || <Filter className="h-3.5 w-3.5 text-accent shrink-0" />}
          <span className="truncate">
            {labelPrefix && <span className="text-muted mr-1">{labelPrefix}:</span>}
            {selectedOption?.label}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu (Styled strictly matching theme) */}
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] rounded-2xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-2xl transition-all animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-mono transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-accent/15 text-accent-text font-semibold border border-accent/25"
                      : "text-text hover:bg-border/40 hover:text-text"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
