import { notFound } from 'next/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getBrandAssetsByToken, trackBrandGuideView } from '@/lib/clients/getBrandAssets';
import smmFreelanceConfig from '@/config/verticals/smm_freelance';
import smmAgencyConfig from '@/config/verticals/smm_agency';
import type { AnyVerticalConfig } from '@/lib/vertical-config';
import type { Metadata } from 'next';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('clients')
    .select('brand_name')
    .eq('brand_guide_token', token)
    .maybeSingle();

  return {
    title: data ? `${data.brand_name} — Brand Guide` : 'Brand Guide',
  };
}

export default async function BrandGuidePage({ params }: Props) {
  const { token } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, brand_name, vertical, vertical_data, platforms')
    .eq('brand_guide_token', token)
    .maybeSingle();

  if (!client) notFound();

  // Track view (non-blocking; fire-and-forget is fine here)
  void trackBrandGuideView(token);

  const [assets] = await Promise.all([
    getBrandAssetsByToken(token),
  ]);

  const vertical: AnyVerticalConfig =
    client.vertical === 'smm_agency' ? smmAgencyConfig : smmFreelanceConfig;

  const verticalData: Record<string, unknown> = client.vertical_data ?? {};

  const pdfUrl = `/api/brand/${token}/pdf`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EBE3', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#FAF7F4', borderBottom: '1px solid #DDD7CE' }} className="px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #C4909A 0%, #6B6178 100%)', fontFamily: 'var(--font-fraunces, serif)' }}
            >
              S
            </div>
            <span className="text-xs text-txt-secondary" style={{ color: '#6B6560' }}>
              Sent via Severl
            </span>
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ borderColor: '#DDD7CE', color: '#6B6560', backgroundColor: '#FAF7F4' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.10em]" style={{ color: '#A09890' }}>
            Brand guide
          </p>
          <h1 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-fraunces, serif)', color: '#1A1714' }}>
            {client.brand_name}
          </h1>
        </div>

        {/* Brand fields */}
        <div className="grid gap-4 md:grid-cols-2">
          {vertical.crm.intakeFields.map((field) => {
            const value = verticalData[field.key];
            const hasValue =
              value !== undefined &&
              value !== null &&
              value !== '' &&
              !(Array.isArray(value) && value.length === 0);

            return (
              <div
                key={field.key}
                className="flex flex-col gap-2 rounded-lg p-4"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-[0.06em]"
                  style={{ color: '#C4BAB0' }}
                >
                  {field.label}
                </p>

                {!hasValue ? (
                  <p className="text-sm italic" style={{ color: '#C4BAB0' }}>
                    Not set
                  </p>
                ) : field.type === 'tags' || field.type === 'multi_select' ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(value) ? value : String(value).split(',').map((s: string) => s.trim()).filter(Boolean)).map(
                      (tag: string) => (
                        <span
                          key={tag}
                          className="rounded px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: '#F7ECED', color: '#8C5562' }}
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                ) : field.type === 'key_value' && typeof value === 'object' && !Array.isArray(value) ? (
                  <div className="flex flex-col gap-1">
                    {Object.entries(value as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-sm" style={{ color: '#1A1714' }}>
                        <span className="font-medium" style={{ color: '#6B6560' }}>{k}:</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#1A1714', lineHeight: '1.5' }}>
                    {String(value)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Brand assets */}
        {assets.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.10em]" style={{ color: '#A09890' }}>
              Assets
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {assets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-2 rounded-lg p-3 transition-shadow hover:shadow-sm"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}
                >
                  {(asset.type === 'logo' || asset.type === 'image') ? (
                    <div className="flex h-20 items-center justify-center overflow-hidden rounded">
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className="max-h-20 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded" style={{ backgroundColor: '#F7ECED' }}>
                      <FileText className="h-8 w-8" style={{ color: '#C4909A' }} />
                    </div>
                  )}
                  <p className="truncate text-xs font-medium" style={{ color: '#1A1714' }}>{asset.name}</p>
                  <p className="text-[10px] capitalize" style={{ color: '#A09890' }}>{asset.type.replace('_', ' ')}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs" style={{ color: '#C4BAB0' }}>
          This brand guide is shared securely via{' '}
          <span className="font-medium" style={{ color: '#A09890' }}>Severl</span>.
        </p>
      </main>
    </div>
  );
}
