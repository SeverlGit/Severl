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
      <body className="flex min-h-screen items-center justify-center bg-brand-navy text-white">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-medium">Something went wrong</h2>
          <button
            onClick={reset}
            className="rounded-lg bg-[#6EE7B7] px-4 py-2 font-medium text-[#0D1B2A]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
