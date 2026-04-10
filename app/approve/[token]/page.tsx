import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { ApproveClient } from './ApproveClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('deliverables')
    .select('title, clients(brand_name)')
    .eq('approval_token', token)
    .maybeSingle();

  const brandName = (data?.clients as { brand_name?: string } | null)?.brand_name ?? '';
  return {
    title: data ? `Review: ${data.title}${brandName ? ` — ${brandName}` : ''}` : 'Content Review',
  };
}

export default async function ApprovePage({ params }: Props) {
  const { token } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, title, type, status, approval_expires_at, clients(brand_name)')
    .eq('approval_token', token)
    .maybeSingle();

  // Invalid token
  if (!deliverable) {
    return <ReviewShell><InvalidState reason="not-found" /></ReviewShell>;
  }

  // Expired
  if (deliverable.approval_expires_at && new Date(deliverable.approval_expires_at) < new Date()) {
    return <ReviewShell><InvalidState reason="expired" /></ReviewShell>;
  }

  // Already reviewed
  if (deliverable.status !== 'pending_approval') {
    return (
      <ReviewShell>
        <InvalidState
          reason={deliverable.status === 'approved' ? 'approved' : 'reviewed'}
        />
      </ReviewShell>
    );
  }

  const brandName = (deliverable.clients as { brand_name?: string } | null)?.brand_name ?? '';

  return (
    <ReviewShell>
      <ApproveClient
        token={token}
        deliverableTitle={deliverable.title}
        deliverableType={deliverable.type}
        brandName={brandName}
      />
    </ReviewShell>
  );
}

function ReviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EBE3', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}>
      <header style={{ backgroundColor: '#FAF7F4', borderBottom: '1px solid #DDD7CE' }} className="px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #C4909A 0%, #6B6178 100%)', fontFamily: 'var(--font-fraunces, serif)' }}
          >
            S
          </div>
          <span className="text-xs" style={{ color: '#6B6560' }}>Sent via Severl</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  );
}

function InvalidState({ reason }: { reason: 'not-found' | 'expired' | 'approved' | 'reviewed' }) {
  const copy = {
    'not-found': {
      title: 'Link not found',
      body: 'This approval link is invalid or has been revoked. Ask your social media manager to resend.',
    },
    expired: {
      title: 'Link expired',
      body: 'This approval link has expired. Ask your social media manager to resend a fresh link.',
    },
    approved: {
      title: 'Already approved',
      body: 'This item has already been approved. No further action is needed.',
    },
    reviewed: {
      title: 'Already reviewed',
      body: 'This item has already been reviewed. No further action is needed.',
    },
  }[reason];

  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}>
      <p className="mb-2 text-base font-medium" style={{ color: '#1A1714' }}>{copy.title}</p>
      <p className="text-sm" style={{ color: '#A09890', lineHeight: '1.6' }}>{copy.body}</p>
    </div>
  );
}
