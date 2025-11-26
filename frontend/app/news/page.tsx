"use client";

import { useEffect, useMemo, useState } from "react";

import AnimatedLoadingSkeleton from "../../components/ui/animated-loading-skeleton";
import { FiltersBar } from "../../components/FiltersBar";
import { SearchBar } from "../../components/SearchBar";

type Article = {
  id: number;
  title: string;
  source: string;
  url: string;
  published_at: string;
  category: string;
  content: string;
};

type Filters = {
  q: string;
  category: string;
  dateFrom: string;
  dateTo: string;
};

const useDebounce = (value: string, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ q: "", category: "", dateFrom: "", dateTo: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch === filters.q) return;
    setFilters((prev) => ({ ...prev, q: debouncedSearch }));
  }, [debouncedSearch]);

  const params = useMemo(() => {
    const url = new URLSearchParams();
    if (filters.q) url.set("q", filters.q);
    if (filters.category) url.set("category", filters.category);
    if (filters.dateFrom) url.set("date_from", filters.dateFrom);
    if (filters.dateTo) url.set("date_to", filters.dateTo);
    url.set("page", "1");
    url.set("page_size", "20");
    return url.toString();
  }, [filters]);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/news?${params}`);
        const data = await response.json();
        setArticles(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error("Failed to fetch articles", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [params]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-primary">NewsIQ</p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Latest News</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Browse through the latest news articles from various sources.</p>
      </header>
      <div className="space-y-4">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <FiltersBar filters={filters} onChange={(update) => setFilters((prev) => ({ ...prev, ...update }))} />
      </div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Articles</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{total} articles</span>
      </div>
      {loading ? (
        <AnimatedLoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No articles found. Try adjusting your filters.</p>
            </div>
          ) : (
            articles.map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md mb-3 flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{article.source}</p>
                    <p className="text-xs text-blue-500 mt-1">{article.category}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{article.content.slice(0, 150)}...</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{new Date(article.published_at).toLocaleDateString()}</span>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Read more
                    <svg
                      className="w-4 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  );
}

