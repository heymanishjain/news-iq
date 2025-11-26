"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-16 bg-white dark:bg-gray-950">
      <header className="text-center space-y-4">
        <p className="text-sm uppercase tracking-wide text-primary font-semibold">NewsIQ</p>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">RAG-powered News Intelligence</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Stay informed with the latest news from multiple sources. Ask questions and get intelligent answers powered by
          AI.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        {/* News Section */}
        <Link
          href="/news"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200 dark:border-blue-800"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Browse News</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Explore the latest articles from technology, sports, business, and general news sources. Filter and search
              through our curated collection.
            </p>
            <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
              View Articles
              <svg
                className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
        </Link>

        {/* Ask NewsIQ Section */}
        <Link
          href="/ask-news-iq"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200 dark:border-purple-800"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ask NewsIQ</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Chat with our AI assistant to get intelligent answers about the latest news. Ask questions in natural
              language and receive detailed responses with citations.
            </p>
            <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
              Start Chatting
              <svg
                className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
        </Link>
      </div>

      {/* Features Section */}
      <section className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-blue-100 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Multiple Sources</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Aggregated news from Hacker News, RSS feeds, and NewsAPI across multiple categories.
          </p>
        </div>
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-purple-100 rounded-lg">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI-Powered Q&A</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Get intelligent answers using RAG (Retrieval-Augmented Generation) technology with source citations.
          </p>
        </div>
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-green-100 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Real-time Updates</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Fresh content updated regularly from multiple news sources to keep you informed.
          </p>
        </div>
      </section>
    </main>
  );
}
