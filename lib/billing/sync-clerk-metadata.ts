import type { PlanTier } from '@/lib/database.types';
import * as Sentry from '@sentry/nextjs';

export async function syncPlanToClerkMetadata(userId: string, planTier: PlanTier) {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is missing');
  }

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          plan_tier: planTier,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Clerk API error: ${res.status} ${errorText}`);
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to sync plan to Clerk metadata', error);
  }
}
