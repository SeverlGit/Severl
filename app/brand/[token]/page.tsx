import { notFound } from 'next/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import smmFreelanceConfig from '@/config/verticals/smm_freelance';
import smmAgencyConfig from '@/config/verticals/smm_agency';
import type { AnyVerticalConfig } from '@/lib/vertical-config';
import type { Metadata } from 'next';

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

  const vertical: AnyVerticalConfig =
    client.vertical === 'smm_agency' ? smmAgencyConfig : smmFreelanceConfig;

  const verticalData: Record<string, unknown> = client.vertical_data ?? {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EBE3', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#FAF7F4', borderBottom: '1px solid #DDD7CE' }} className="px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Severl logo mark */}
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

        <p className="mt-10 text-center text-xs" style={{ color: '#C4BAB0' }}>
          This brand guide is shared securely via{' '}
          <span className="font-medium" style={{ color: '#A09890' }}>Severl</span>.
        </p>
      </main>
    </div>
  );
}
