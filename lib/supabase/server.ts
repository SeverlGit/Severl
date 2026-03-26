import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { url, anonKey };
}

/**
 * Server client scoped to the current Clerk session.
 * Uses Clerk's native Supabase integration (third-party auth via JWKS).
 * Supabase verifies the Clerk session token directly — no JWT template needed.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const { url, anonKey } = getEnv();

  return createClient(url, anonKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}

/**
 * Service-role admin client — bypasses RLS entirely.
 * Only use in trusted server actions where the caller has already
 * verified the user's identity via Clerk (e.g. createOrg, getCurrentOrg).
 * Never expose this client to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const { url } = getEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
