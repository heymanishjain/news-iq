"use client";

import { ChangeEvent } from "react";

type Filters = {
  category: string;
  dateFrom: string;
  dateTo: string;
  q: string;
};

type Props = {
  filters: Filters;
  onChange: (updates: Partial<Filters>) => void;
};

const categories = [
  { value: "", label: "All Categories" },
  { value: "technology", label: "💻 Technology" },
  { value: "sports", label: "⚽ Sports" },
  { value: "business", label: "💼 Business" },
  { value: "general", label: "📰 General" },
];

export function FiltersBar({ filters, onChange }: Props) {
  const handleInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onChange({ [name]: value });
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
      <p className="mb-3 sm:mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Refine Results
      </p>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleInput}
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/10"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date From</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleInput}
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/10"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date To</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleInput}
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/10"
          />
        </div>
      </div>
    </div>
  );
}
