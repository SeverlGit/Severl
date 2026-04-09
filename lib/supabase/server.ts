import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
  return { url, publishableKey };
}

/**
 * Server client scoped to the current Clerk session.
 * Uses Clerk's native Supabase integration (third-party auth via JWKS).
 * Supabase verifies the Clerk session token directly — no JWT template needed.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const { url, publishableKey } = getEnv();

  return createClient(url, publishableKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}

/**
 * Secret-key admin client — bypasses RLS entirely.
 * Only use in trusted server actions where the caller has already
 * verified the user's identity via Clerk (e.g. createOrg, getCurrentOrg).
 * Never expose this client to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const { url } = getEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY');
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}
