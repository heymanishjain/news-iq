"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`relative rounded-2xl border px-4 py-3 transition-all ${
        isFocused
          ? "border-primary shadow-lg shadow-primary/10"
          : "border-gray-200 shadow-sm dark:border-gray-800"
      } bg-white/80 backdrop-blur dark:bg-gray-900/60`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Search headlines
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Try “AI in sports” or “market outlook”"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="mt-1 w-full border-none bg-transparent text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-50"
          />
        </div>
      </div>
    </div>
  );
}

