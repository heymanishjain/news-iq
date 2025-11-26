"use client";

import { ChatPanel } from "../../components/ChatPanel";

export default function AskNewsIQPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
      <header className="text-center">
        <p className="text-xs sm:text-sm uppercase tracking-wide text-primary">NewsIQ</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">Ask NewsIQ</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
          Ask natural language questions about the latest news. I'll search through our article database and provide
          answers with citations.
        </p>
      </header>
      <div className="mx-auto max-w-5xl">
        <div className="h-[600px] sm:h-[650px]">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}

