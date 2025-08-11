"use client";

import Link from "next/link";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-3xl py-16">
      <div className="rounded-2xl p-8 glass-surface border border-white/20 dark:border-white/10">
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-neutral-dark dark:text-dark-neutral-dark mb-6">
          We couldn't load the blog content. Please try again later.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover"
          >
            Retry
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}