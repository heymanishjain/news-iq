"use client";

import { useEffect } from "react";
import Link from "next/link";

type Props = {
  url: string;
};

export function ExternalRedirect({ url }: Props) {
  useEffect(() => {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(url);
    
    // Validate it's an external URL
    if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
      // Redirect to external URL
      window.location.href = decodedUrl;
    }
  }, [url]);

  // Show a loading message while redirecting
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Redirecting to original source...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          If you are not redirected automatically,{" "}
          <a
            href={decodeURIComponent(url)}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>
        </p>
        <Link href="/news" className="text-primary hover:underline text-sm">
          ← Back to news feed
        </Link>
      </div>
    </div>
  );
}

