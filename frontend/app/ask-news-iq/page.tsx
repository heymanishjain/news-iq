"use client";

import { ChatPanel } from "../../components/ChatPanel";

export default function AskNewsIQPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="text-center">
        <p className="text-sm uppercase tracking-wide text-primary">NewsIQ</p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Ask NewsIQ</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ask natural language questions about the latest news. I'll search through our article database and provide
          answers with citations.
        </p>
      </header>
      <div className="mx-auto max-w-5xl">
        <ChatPanel />
      </div>
    </main>
  );
}

