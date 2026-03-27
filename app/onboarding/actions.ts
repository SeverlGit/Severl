'use server';

import * as Sentry from '@sentry/nextjs';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getWelcomeEmail, sendEmail } from '@/lib/email/welcome';

type CreateOrgState = {
  error?: string;
};

export async function createOrg(
  _prevState: CreateOrgState | void,
  formData: FormData,
): Promise<CreateOrgState | void> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    Sentry.captureMessage('NEXT_PUBLIC_SUPABASE_URL is not set', 'error');
    return { error: 'Configuration error. Please contact support.' };
  }

  const name = String(formData.get('business_name') || '').trim();
  const vertical = String(formData.get('vertical') || '').trim();
  let timezone = String(formData.get('timezone') || '').trim();

  // Validate the timezone is a real IANA zone; fall back to UTC if not
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    timezone = 'UTC';
  }
  if (!timezone) timezone = 'UTC';

  if (!name || (vertical !== 'smm_freelance' && vertical !== 'smm_agency')) {
    return { error: 'Please select how you work.' };
  }

  const supabase = getSupabaseAdminClient();

  // Avoid duplicate orgs if form is submitted twice
  const { data: existing, error: existingError } = await supabase
    .from('orgs')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    Sentry.captureException(existingError, { extra: { context: 'createOrg', step: 'checkExisting' } });
    return { error: 'Unable to verify workspace. Please try again.' };
  }

  if (existing) {
    redirect('/');
  }

  const { error } = await supabase.from('orgs').insert({
    name,
    vertical,
    owner_id: userId,
    timezone,
  });

  if (error) {
    Sentry.captureException(error, { extra: { context: 'createOrg', step: 'insert' } });
    return { error: 'Unable to create workspace. Please try again.' };
  }

  // Best-effort welcome email
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      const template = getWelcomeEmail({
        to: email,
        firstName: user?.firstName ?? undefined,
      });
      await sendEmail(template);
    }
  } catch (e) {
    Sentry.captureException(e, { extra: { context: 'createOrg', step: 'welcomeEmail' } });
  }

  redirect('/');
}
