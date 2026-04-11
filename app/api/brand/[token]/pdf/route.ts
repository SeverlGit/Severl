import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getBrandAssetsByToken } from '@/lib/clients/getBrandAssets';
import smmFreelanceConfig from '@/config/verticals/smm_freelance';
import smmAgencyConfig from '@/config/verticals/smm_agency';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { token } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, brand_name, vertical, vertical_data')
    .eq('brand_guide_token', token)
    .maybeSingle();

  if (!client) {
    return new NextResponse('Not found', { status: 404 });
  }

  const vertical =
    client.vertical === 'smm_agency' ? smmAgencyConfig : smmFreelanceConfig;

  const verticalData: Record<string, unknown> = client.vertical_data ?? {};
  const assets = await getBrandAssetsByToken(token);

  const fieldsHtml = vertical.crm.intakeFields
    .map((field) => {
      const value = verticalData[field.key];
      const hasValue =
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0);

      let valueHtml = '<span style="color:#C4BAB0;font-style:italic">Not set</span>';

      if (hasValue) {
        if (field.type === 'tags' || field.type === 'multi_select') {
          const items = Array.isArray(value)
            ? value
            : String(value).split(',').map((s) => s.trim()).filter(Boolean);
          valueHtml = items
            .map(
              (tag) =>
                `<span style="background:#F7ECED;color:#8C5562;padding:2px 8px;border-radius:4px;font-size:11px;margin-right:4px">${tag}</span>`,
            )
            .join('');
        } else if (
          field.type === 'key_value' &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          valueHtml = Object.entries(value as Record<string, string>)
            .map(
              ([k, v]) =>
                `<div style="font-size:13px;margin-bottom:2px"><span style="color:#6B6560;font-weight:500">${k}:</span> ${v}</div>`,
            )
            .join('');
        } else {
          valueHtml = `<p style="font-size:13px;color:#1A1714;white-space:pre-wrap;margin:0;line-height:1.5">${String(value)}</p>`;
        }
      }

      return `
        <div style="background:#fff;border:1px solid #DDD7CE;border-radius:8px;padding:16px;margin-bottom:12px;break-inside:avoid">
          <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#C4BAB0;margin:0 0 8px">${field.label}</p>
          <div>${valueHtml}</div>
        </div>`;
    })
    .join('');

  const assetsHtml =
    assets.length > 0
      ? `
      <div style="margin-top:32px">
        <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.10em;color:#A09890;margin:0 0 12px">Assets</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          ${assets
            .map(
              (asset) => `
            <div style="width:140px;border:1px solid #DDD7CE;border-radius:8px;padding:12px;text-align:center;break-inside:avoid">
              ${
                asset.type === 'logo' || asset.type === 'image'
                  ? `<img src="${asset.file_url}" style="max-height:64px;max-width:100%;object-fit:contain;margin-bottom:8px" />`
                  : `<div style="height:64px;background:#F7ECED;border-radius:4px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:11px;color:#C4909A">File</div>`
              }
              <p style="font-size:11px;font-weight:500;color:#1A1714;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${asset.name}</p>
              <p style="font-size:10px;color:#A09890;margin:4px 0 0;text-transform:capitalize">${asset.type.replace('_', ' ')}</p>
            </div>`,
            )
            .join('')}
        </div>
      </div>`
      : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${client.brand_name} — Brand Guide</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #F0EBE3;
      margin: 0;
      padding: 40px;
      color: #1A1714;
    }
    .container { max-width: 680px; margin: 0 auto; }
    .header {
      background: #FAF7F4;
      border: 1px solid #DDD7CE;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-mark {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #C4909A, #6B6178);
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      color: #A09890;
      margin: 0 0 8px;
    }
    h1 { font-size: 28px; font-weight: 500; color: #1A1714; margin: 0 0 32px; }
    .fields { columns: 2; column-gap: 12px; }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #C4BAB0;
    }
    @media print {
      body { background: white; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display:flex;align-items:center">
        <span class="logo-mark">S</span>
        <span style="font-size:12px;color:#6B6560">Sent via Severl</span>
      </div>
      <button class="no-print" onclick="window.print()" style="background:#FAF7F4;border:1px solid #DDD7CE;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;color:#6B6560">
        Print / Save as PDF
      </button>
    </div>

    <p class="eyebrow">Brand guide</p>
    <h1>${client.brand_name}</h1>

    <div class="fields">
      ${fieldsHtml}
    </div>

    ${assetsHtml}

    <p class="footer">
      This brand guide is shared securely via <strong style="color:#A09890">Severl</strong>.
    </p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
