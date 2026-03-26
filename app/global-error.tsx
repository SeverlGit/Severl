'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-panel text-white">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-medium">Something went wrong</h2>
          <button
            onClick={reset}
            className="rounded-lg bg-[#5A8A6A] px-4 py-2 font-medium text-[#FAF7F4]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
