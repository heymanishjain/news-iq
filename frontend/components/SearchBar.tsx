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
      className={`relative rounded-2xl border-2 transition-all duration-300 ${
        isFocused
          ? "border-primary shadow-xl shadow-primary/20 dark:shadow-primary/10 bg-white dark:bg-gray-800"
          : "border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
          isFocused 
            ? "bg-primary text-white" 
            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
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
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">
            Search headlines
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search for news, topics, or keywords..."
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="mt-1 w-full border-none bg-transparent text-lg font-semibold text-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none dark:text-gray-50"
          />
        </div>
      </div>
    </div>
  );
}
