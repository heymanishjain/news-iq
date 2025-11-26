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
  { value: "", label: "All" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
];

export function FiltersBar({ filters, onChange }: Props) {
  const handleInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onChange({ [name]: value });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/40">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        Refine results
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleInput}
            className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-primary focus:ring focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date from</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleInput}
            className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-primary focus:ring focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date to</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleInput}
            className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-primary focus:ring focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100"
          />
        </div>
      </div>
    </div>
  );
}
