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
  image_url?: string | null;
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

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getCategoryConfig = (category: string) => {
  const configs: Record<string, { color: string; bg: string; icon: string }> = {
    technology: {
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      icon: "💻",
    },
    sports: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      icon: "⚽",
    },
    business: {
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
      icon: "💼",
    },
    general: {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
      icon: "📰",
    },
  };
  return configs[category] || configs.general;
};

const getSourceConfig = (source: string) => {
  const sourceConfigs: Record<string, { icon: string; color: string; badge: string }> = {
    "The Hindu": {
      icon: "📖",
      color: "text-orange-600 dark:text-orange-400",
      badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    },
    "The Indian Express": {
      icon: "📰",
      color: "text-red-600 dark:text-red-400",
      badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    },
    "Ars Technica": {
      icon: "🔬",
      color: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    },
    "ESPN": {
      icon: "🏀",
      color: "text-green-600 dark:text-green-400",
      badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    },
    "Hacker News": {
      icon: "🔥",
      color: "text-orange-600 dark:text-orange-400",
      badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    },
  };
  return sourceConfigs[source] || { icon: "📄", color: "text-gray-600 dark:text-gray-400", badge: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" };
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ q: "", category: "", dateFrom: "", dateTo: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false); // Default: collapsed
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

  // Handle manual toggle - simple click to show/hide
  const handleToggleFilters = () => {
    setIsFiltersExpanded(!isFiltersExpanded);
  };

  // Group articles by date
  const groupedArticles = useMemo(() => {
    const groups: Record<string, Article[]> = {};
    articles.forEach((article) => {
      const date = new Date(article.published_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(article);
    });
    return groups;
  }, [articles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header Section */}
      <div className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-4 lg:px-6 py-3 sm:py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Your Briefing
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-1.5">
                {total} {total === 1 ? "story" : "stories"} from trusted sources
              </p>
            </div>
            <button
              onClick={handleToggleFilters}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-sm"
              aria-label={isFiltersExpanded ? "Collapse filters" : "Expand filters"}
            >
              <span className="font-semibold">{isFiltersExpanded ? "Hide" : "Show"} Filters</span>
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isFiltersExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className={`space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${
            isFiltersExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <FiltersBar filters={filters} onChange={(update) => setFilters((prev) => ({ ...prev, ...update }))} />
      </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {loading ? (
        <AnimatedLoadingSkeleton />
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No articles found</p>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
          <div className="space-y-8 sm:space-y-10">
            {Object.entries(groupedArticles).map(([dateGroup, dateArticles]) => (
              <div key={dateGroup} className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{dateGroup}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700"></div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{dateArticles.length} stories</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {dateArticles.map((article, index) => {
                    const isLarge = index === 0 && dateArticles.length > 0;
                    const categoryConfig = getCategoryConfig(article.category);
                    const sourceConfig = getSourceConfig(article.source);
                    const hasImage = article.image_url && article.image_url.trim() !== "";

                    return (
                      <article
                        key={article.id}
                        className={`group relative bg-white dark:bg-gray-800/50 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 ${
                          isLarge ? "sm:col-span-2 lg:col-span-2" : ""
                        }`}
                      >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                          className="block h-full"
                        >
                          {/* Image Section */}
                          <div className={`relative ${isLarge ? "h-48 sm:h-64 lg:h-72" : "h-40 sm:h-48 lg:h-56"} bg-gradient-to-br ${categoryConfig.bg} overflow-hidden`}>
                            {hasImage ? (
                              <>
                                <img
                                  src={article.image_url!}
                                  alt={article.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = "none";
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = "flex";
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                <div className="w-full h-full hidden items-center justify-center absolute inset-0">
                                  <div className="text-center p-4">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${categoryConfig.bg} border ${categoryConfig.color} mb-2`}>
                                      <span>{categoryConfig.icon}</span>
                                      <span className="text-xs font-semibold uppercase tracking-wide">{article.category}</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${sourceConfig.badge} mt-2`}>
                                      <span className="text-xs">{sourceConfig.icon}</span>
                                      <p className="text-xs font-semibold text-white">{article.source}</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center p-6">
                                  {/* <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${categoryConfig.bg} border ${categoryConfig.color} mb-3`}>
                                    <span className="text-xl">{categoryConfig.icon}</span>
                                    <span className="text-xs font-semibold uppercase tracking-wide">{article.category}</span>
                                  </div> */}
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${sourceConfig.badge} mt-2`}>
                                    <span>{sourceConfig.icon}</span>
                                    <p className="text-sm font-semibold">{article.source}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Category Badge Overlay */}
                            <div className="absolute top-4 left-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-700/50 ${categoryConfig.color}`}>
                                <span className="text-xs">{categoryConfig.icon}</span>
                                <span className="text-xs font-semibold uppercase tracking-wide">{article.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                              <div className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg ${sourceConfig.badge} border border-current/20`}>
                                <span className="text-xs">{sourceConfig.icon}</span>
                                <span className={`text-xs font-semibold ${sourceConfig.color}`}>{article.source}</span>
                              </div>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">{formatTimeAgo(article.published_at)}</span>
                            </div>
                            <h3 className={`font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary transition-colors ${
                              isLarge ? "text-lg sm:text-xl lg:text-2xl leading-tight line-clamp-3" : "text-base sm:text-lg lg:text-xl leading-snug line-clamp-2"
                            }`}>
                              {article.title}
                            </h3>
                            <p className={`text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed ${
                              isLarge ? "text-sm sm:text-base line-clamp-3" : "text-xs sm:text-sm line-clamp-2"
                            }`}>
                              {article.content.slice(0, isLarge ? 250 : 150)}
                              {article.content.length > (isLarge ? 250 : 150) && "..."}
                            </p>
                            <div className="flex items-center text-primary dark:text-blue-400 text-xs sm:text-sm font-semibold group-hover:gap-2 transition-all">
                              Read full story
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                            </div>
                          </div>
                  </a>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
    </div>
  );
}
