import type { Metadata } from 'next';
import { getBatchApprovalData } from '@/lib/deliverables/batch-approval-actions';
import { BatchApproveClient } from './BatchApproveClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await getBatchApprovalData(token);
  return {
    title: data ? `Review: ${data.deliverables.length} items — ${data.clientName}` : 'Content Review',
  };
}

export default async function BatchApprovePage({ params }: Props) {
  const { token } = await params;
  const data = await getBatchApprovalData(token);

  const showOrgBrand = !!data?.orgLogoUrl || !!data?.orgName;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F0EBE3', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <header
        style={{ backgroundColor: '#FAF7F4', borderBottom: '1px solid #DDD7CE' }}
        className="px-6 py-4"
      >
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          {showOrgBrand && data?.orgLogoUrl ? (
            <img
              src={data.orgLogoUrl}
              alt={data.orgName}
              className="h-7 w-7 rounded-md object-contain"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-white text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #C4909A 0%, #6B6178 100%)',
                fontFamily: 'var(--font-fraunces, serif)',
              }}
            >
              {showOrgBrand && data?.orgName ? data.orgName[0].toUpperCase() : 'S'}
            </div>
          )}
          <span className="text-xs" style={{ color: '#6B6560' }}>
            {showOrgBrand && data?.orgName ? data.orgName : 'Sent via Severl'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        {!data ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}
          >
            <p className="mb-2 text-base font-medium" style={{ color: '#1A1714' }}>
              Link not found
            </p>
            <p className="text-sm" style={{ color: '#A09890', lineHeight: '1.6' }}>
              This batch approval link is invalid or has expired. Ask your social media manager to
              resend.
            </p>
          </div>
        ) : (
          <BatchApproveClient
            token={token}
            clientName={data.clientName}
            deliverables={data.deliverables}
          />
        )}
      </main>
    </div>
  );
}
