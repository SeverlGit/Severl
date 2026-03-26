import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { InvoiceLineItemRow, InvoiceRow } from '@/lib/database.types';

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatInvoiceType(t: string): string {
  const map: Record<string, string> = {
    retainer: 'Retainer',
    project: 'Project',
    ad_spend: 'Ad spend',
  };
  return map[t] ?? t.replace(/_/g, ' ');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const { id: invoiceId } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: org, error: orgErr } = await supabase
    .from('orgs')
    .select('id, name')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (orgErr || !org) {
    return new NextResponse('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('org_id', org.id)
    .maybeSingle();

  if (invErr || !invoice) {
    return new NextResponse('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const inv = invoice as InvoiceRow;

  const [{ data: lineItems }, { data: client }] = await Promise.all([
    supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id', { ascending: true }),
    supabase
      .from('clients')
      .select('brand_name, contact_name, contact_email')
      .eq('id', inv.client_id)
      .maybeSingle(),
  ]);

  const rows = (lineItems ?? []) as InvoiceLineItemRow[];
  const lineSum = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const invoiceTotal = Number(inv.total ?? 0);

  const orgName = escapeHtml(org.name);
  const clientBrand = escapeHtml(client?.brand_name ?? '—');
  const contactName = escapeHtml(client?.contact_name ?? '');
  const contactEmail = escapeHtml(client?.contact_email ?? '');

  const lineRowsHtml = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.description)}</td>
      <td class="num">${escapeHtml(String(Number(r.quantity ?? 0)))}</td>
      <td class="num">${formatMoney(Number(r.unit_price ?? 0))}</td>
      <td class="num">${formatMoney(Number(r.total ?? 0))}</td>
    </tr>`,
    )
    .join('');

  const statusLabel = escapeHtml(String(inv.status ?? '').replace(/_/g, ' '));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(inv.invoice_number)} — ${orgName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #111827;
      background: #f3f4f6;
    }
    .no-print {
      padding: 16px;
      text-align: center;
      background: #e5e7eb;
      border-bottom: 1px solid #d1d5db;
    }
    .no-print button {
      font: inherit;
      cursor: pointer;
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #111827;
      background: #111827;
      color: #fff;
    }
    .no-print button:hover { background: #374151; }
    .sheet {
      max-width: 210mm;
      min-height: 260mm;
      margin: 0 auto;
      padding: 24px 28px 48px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    @media screen and (min-width: 900px) {
      .sheet { margin: 24px auto; border-radius: 4px; }
    }
    .from-block { margin-bottom: 32px; }
    .from-block .org { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; }
    .from-block .sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .grid-top {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    @media (max-width: 640px) { .grid-top { grid-template-columns: 1fr; } }
    .bill-to h2 {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
    }
    .bill-to .name { font-size: 18px; font-weight: 600; color: #0f172a; }
    .bill-to .meta { font-size: 13px; color: #374151; margin-top: 6px; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .meta-table th {
      text-align: left;
      font-weight: 600;
      color: #6b7280;
      padding: 4px 8px 4px 0;
      width: 42%;
    }
    .meta-table td { padding: 4px 0; color: #111827; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    table.items th {
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
      padding: 10px 8px;
    }
    table.items th.num { text-align: right; }
    table.items td {
      border-bottom: 1px solid #e5e7eb;
      padding: 12px 8px;
      vertical-align: top;
    }
    table.items td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .totals {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-inner {
      min-width: 240px;
      font-size: 14px;
    }
    .totals-row { display: flex; justify-content: space-between; gap: 24px; padding: 4px 0; }
    .totals-row.grand {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 2px solid #111827;
      font-size: 18px;
      font-weight: 700;
    }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
    .muted { color: #6b7280; font-size: 12px; margin-top: 4px; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .sheet {
        box-shadow: none;
        margin: 0;
        max-width: none;
        min-height: auto;
        padding: 12mm 14mm;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    <p class="muted" style="margin: 12px 0 0;">Use your browser’s print dialog — choose “Save as PDF” to download.</p>
  </div>
  <div class="sheet">
    <div class="from-block">
      <div class="org">${orgName}</div>
      <div class="sub">Invoice</div>
    </div>
    <div class="grid-top">
      <div class="bill-to">
        <h2>Bill to</h2>
        <div class="name">${clientBrand}</div>
        ${contactName ? `<div class="meta">${contactName}</div>` : ''}
        ${contactEmail ? `<div class="meta">${contactEmail}</div>` : ''}
      </div>
      <div>
        <table class="meta-table">
          <tr><th>Invoice #</th><td>${escapeHtml(inv.invoice_number)}</td></tr>
          <tr><th>Type</th><td>${escapeHtml(formatInvoiceType(inv.invoice_type))}</td></tr>
          <tr><th>Status</th><td style="text-transform: capitalize;">${statusLabel}</td></tr>
          <tr><th>Billing month</th><td>${escapeHtml(formatDateLong(inv.billing_month ?? null))}</td></tr>
          <tr><th>Due date</th><td>${escapeHtml(formatDateLong(inv.due_date ?? null))}</td></tr>
          <tr><th>Created</th><td>${escapeHtml(formatDateLong(inv.created_at))}</td></tr>
        </table>
      </div>
    </div>
    <h2 style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin:0 0 8px;">Line items</h2>
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Unit price</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineRowsHtml || `<tr><td colspan="4" style="color:#6b7280;">No line items.</td></tr>`}
      </tbody>
    </table>
    <div class="totals">
      <div class="totals-inner">
        <div class="totals-row">
          <span>Subtotal (line items)</span>
          <span>${formatMoney(lineSum)}</span>
        </div>
        <div class="totals-row grand">
          <span>Total</span>
          <span>${formatMoney(invoiceTotal)}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      Generated by Severl — client-ready invoice view. Amounts in USD.
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}
