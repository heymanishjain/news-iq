import Link from "next/link";
import { ExternalRedirect } from "../../components/ExternalRedirect";

async function getArticle(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  try {
    const response = await fetch(`${baseUrl}/api/news/${id}`, { 
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export default async function ArticlePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string };
  searchParams: { source?: string };
}) {
  const article = await getArticle(params.id);
  
  // If article not found but we have a source URL, redirect to it (client-side)
  if (!article && searchParams.source) {
    return <ExternalRedirect url={searchParams.source} />;
  }
  
  // If article not found and no source URL, show error
  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-gray-600 dark:text-gray-400">Article not found.</p>
          <Link href="/news" className="text-primary hover:underline mt-4 inline-block">
            ← Back to news feed
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Link 
        href="/news" 
        className="text-primary hover:underline inline-flex items-center gap-2 mb-4"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to news feed
      </Link>
      <article className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="font-semibold text-gray-800 dark:text-gray-200">{article.source}</span>
          <span>•</span>
          <span>{new Date(article.published_at).toLocaleString()}</span>
          <span>•</span>
          <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-blue-700 dark:text-blue-300 text-xs font-medium">
            {article.category}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {article.title}
        </h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {article.content}
          </p>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Read original source
            <svg
              className="w-4 h-4"
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
    </div>
  );
}
