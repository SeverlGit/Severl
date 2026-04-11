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
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-');
      return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
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

const STATUS_PILL: Record<string, string> = {
  draft:   'background:#F2F2F2;color:#888888',
  sent:    'background:#FEF3E2;color:#A06010',
  paid:    'background:#EAFAF0;color:#2A7048',
  overdue: 'background:#FEECEC;color:#A02020',
  voided:  'background:#F2F2F2;color:#999999',
};

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

  const lineRowsHtml = rows.length > 0
    ? rows.map((r) => `
    <tr>
      <td>
        <div class="item-name">${escapeHtml(r.description)}</div>
      </td>
      <td class="r">${escapeHtml(String(Number(r.quantity ?? 0)))}</td>
      <td class="r">${formatMoney(Number(r.unit_price ?? 0))}</td>
      <td class="r">0%</td>
      <td class="r">${formatMoney(Number(r.total ?? 0))}</td>
    </tr>`).join('')
    : `<tr><td colspan="5" style="color:#888888;font-size:12px;padding:12px 0;">No line items.</td></tr>`;

  const pillStyle = STATUS_PILL[inv.status] ?? STATUS_PILL.draft;
  const statusDisplay = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);

  const invoiceDate = escapeHtml(formatDateLong(inv.created_at));
  const dueDate     = escapeHtml(formatDateLong(inv.due_date ?? null));
  const billingPeriod = inv.billing_month
    ? escapeHtml(formatDateLong(inv.billing_month).replace(/\s\d+,/, ''))
    : '—';

  const notesHtml = inv.notes
    ? `<p class="tax-note" style="margin-top:8px;"><strong>Note:</strong> ${escapeHtml(inv.notes)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(inv.invoice_number)} — ${orgName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink-1: #111111; --ink-2: #444444; --ink-3: #888888; --ink-4: #BBBBBB;
      --line: #DDDDDD; --line-soft: #F0F0F0; --bg-tint: #FAFAFA; --rose: #C4909A;
    }
    html {
      background: #E8E8E8;
      font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px; color: var(--ink-1);
      -webkit-font-smoothing: antialiased;
    }
    body { display: flex; flex-direction: column; align-items: center; padding: 40px 16px 80px; }
    .print-bar { width: 720px; max-width: 100%; display: flex; justify-content: flex-end; margin-bottom: 14px; }
    .print-btn {
      background: var(--ink-1); color: #fff; border: none;
      padding: 9px 20px; border-radius: 5px;
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
      cursor: pointer; letter-spacing: 0.01em;
    }
    .page { width: 720px; max-width: 100%; background: #fff; border: 1px solid #CCCCCC; border-radius: 3px; overflow: hidden; }
    .accent-line { height: 3px; background: var(--rose); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 30px 40px 24px; border-bottom: 1px solid var(--line); }
    .sender-block { display: flex; flex-direction: column; gap: 8px; }
    .logo-row { display: flex; align-items: center; gap: 8px; }
    .logo-mark {
      width: 26px; height: 26px; border-radius: 5px;
      background: linear-gradient(135deg, #C4909A 0%, #6B6178 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Fraunces', Georgia, serif; font-size: 12px; font-weight: 400; color: #fff; flex-shrink: 0;
    }
    .business-name { font-size: 14px; font-weight: 600; color: var(--ink-1); letter-spacing: -0.01em; }
    .invoice-id-block { text-align: right; }
    .invoice-word { font-family: 'Fraunces', Georgia, serif; font-size: 26px; font-weight: 300; color: var(--ink-1); letter-spacing: -0.01em; display: block; margin-bottom: 5px; }
    .invoice-number { font-size: 12px; font-weight: 500; color: var(--ink-3); display: block; margin-bottom: 8px; font-variant-numeric: tabular-nums; }
    .status-pill { display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
    .meta-bar { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line); }
    .meta-col { padding: 18px 40px; }
    .meta-col:first-child { border-right: 1px solid var(--line); }
    .meta-col-title { font-size: 9px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 9px; }
    .client-name { font-size: 13px; font-weight: 600; color: var(--ink-1); margin-bottom: 2px; }
    .client-detail { font-size: 11px; color: var(--ink-3); line-height: 1.75; }
    .meta-table { width: 100%; border-collapse: collapse; }
    .meta-table td { padding: 2.5px 0; font-size: 11.5px; vertical-align: top; }
    .meta-table .mk { color: var(--ink-3); width: 50%; padding-right: 8px; }
    .meta-table .mv { color: var(--ink-1); font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; }
    .meta-table .mv.bold { font-weight: 600; }
    .items-wrap { padding: 22px 40px; border-bottom: 1px solid var(--line); }
    .section-title { font-size: 9px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 11px; }
    table.items { width: 100%; border-collapse: collapse; }
    .items thead tr { border-bottom: 1px solid var(--line); }
    .items thead th { font-size: 10px; font-weight: 600; color: var(--ink-3); letter-spacing: 0.04em; text-transform: uppercase; padding-bottom: 8px; text-align: left; }
    .items thead th.r { text-align: right; }
    .items tbody tr { border-bottom: 1px solid var(--line-soft); }
    .items tbody tr:last-child { border-bottom: none; }
    .items tbody td { padding: 10px 0; font-size: 12px; color: var(--ink-1); vertical-align: top; }
    .items tbody td.r { text-align: right; color: var(--ink-2); font-variant-numeric: tabular-nums; }
    .item-name { font-weight: 500; }
    .bottom-grid { display: grid; grid-template-columns: 1fr 210px; border-bottom: 1px solid var(--line); }
    .tax-col { padding: 18px 40px; border-right: 1px solid var(--line); display: flex; flex-direction: column; justify-content: center; gap: 6px; }
    .tax-note { font-size: 11px; color: var(--ink-3); line-height: 1.65; }
    .tax-note strong { color: var(--ink-2); font-weight: 500; }
    .totals-col { padding: 18px 40px 18px 20px; }
    .t-row { display: flex; justify-content: space-between; align-items: baseline; padding: 3.5px 0; }
    .t-row + .t-row { border-top: 1px solid var(--line-soft); }
    .t-lbl { font-size: 11.5px; color: var(--ink-3); }
    .t-val { font-size: 11.5px; color: var(--ink-2); font-weight: 500; font-variant-numeric: tabular-nums; }
    .t-divider { height: 1px; background: var(--line); margin: 7px 0; }
    .t-row.grand .t-lbl { font-size: 12.5px; font-weight: 600; color: var(--ink-1); }
    .t-row.grand .t-val { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 400; color: var(--ink-1); letter-spacing: -0.02em; }
    .t-row.balance .t-lbl { font-size: 12.5px; font-weight: 600; color: var(--ink-1); }
    .t-row.balance .t-val { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 400; color: var(--ink-1); letter-spacing: -0.02em; }
    .payment-section { padding: 18px 40px; background: var(--bg-tint); border-bottom: 1px solid var(--line); }
    .terms-section { padding: 16px 40px; border-bottom: 1px solid var(--line); }
    .terms-text { font-size: 11px; color: var(--ink-3); line-height: 1.65; }
    .terms-text strong { color: var(--ink-2); font-weight: 500; }
    .footer { padding: 13px 40px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-tint); }
    .footer-txt { font-size: 10px; color: var(--ink-4); line-height: 1.6; }
    @media print {
      html, body { background: #fff; padding: 0; }
      .print-bar  { display: none !important; }
      .page { border: none; border-radius: 0; box-shadow: none; width: 100%; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">&#8659; Save as PDF</button>
  </div>

  <div class="page">

    <div class="accent-line"></div>

    <div class="header">
      <div class="sender-block">
        <div class="logo-row">
          <div class="logo-mark">S</div>
          <span class="business-name">${orgName}</span>
        </div>
      </div>
      <div class="invoice-id-block">
        <span class="invoice-word">Invoice</span>
        <span class="invoice-number">${escapeHtml(inv.invoice_number)}</span>
        <span class="status-pill" style="${pillStyle}">${statusDisplay}</span>
      </div>
    </div>

    <div class="meta-bar">
      <div class="meta-col">
        <div class="meta-col-title">Billed to</div>
        <div class="client-name">${clientBrand}</div>
        <div class="client-detail">
          ${contactName ? `${contactName}` : ''}
          ${contactEmail ? `${contactName ? '<br />' : ''}${contactEmail}` : ''}
        </div>
      </div>
      <div class="meta-col">
        <div class="meta-col-title">Invoice details</div>
        <table class="meta-table">
          <tr><td class="mk">Invoice no.</td>   <td class="mv">${escapeHtml(inv.invoice_number)}</td></tr>
          <tr><td class="mk">Invoice date</td>  <td class="mv">${invoiceDate}</td></tr>
          <tr><td class="mk">Due date</td>      <td class="mv bold">${dueDate}</td></tr>
          <tr><td class="mk">Billing period</td><td class="mv">${billingPeriod}</td></tr>
          <tr><td class="mk">Service type</td>  <td class="mv">${escapeHtml(formatInvoiceType(inv.invoice_type))}</td></tr>
        </table>
      </div>
    </div>

    <div class="items-wrap">
      <div class="section-title">Services rendered</div>
      <table class="items">
        <thead>
          <tr>
            <th style="width:46%">Description</th>
            <th style="width:12%" class="r">Qty</th>
            <th style="width:16%" class="r">Unit price</th>
            <th style="width:9%"  class="r">Tax</th>
            <th style="width:17%" class="r">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineRowsHtml}
        </tbody>
      </table>
    </div>

    <div class="bottom-grid">
      <div class="tax-col">
        <p class="tax-note">Services provided by <strong>${orgName}</strong>.</p>
        ${notesHtml}
      </div>
      <div class="totals-col">
        <div class="t-row">
          <span class="t-lbl">Subtotal</span>
          <span class="t-val">${formatMoney(lineSum)}</span>
        </div>
        <div class="t-row">
          <span class="t-lbl">Tax (0%)</span>
          <span class="t-val">${formatMoney(0)}</span>
        </div>
        <div class="t-row">
          <span class="t-lbl">Discount</span>
          <span class="t-val">—</span>
        </div>
        <div class="t-divider"></div>
        <div class="t-row grand">
          <span class="t-lbl">Total</span>
          <span class="t-val">${formatMoney(invoiceTotal)}</span>
        </div>
        <div class="t-divider"></div>
        <div class="t-row balance">
          <span class="t-lbl">Balance due</span>
          <span class="t-val">${formatMoney(invoiceTotal)}</span>
        </div>
      </div>
    </div>

    <div class="payment-section">
      <div class="section-title">Payment instructions</div>
      ${inv.stripe_payment_link_url
        ? `<div style="margin-top:10px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <a href="${escapeHtml(inv.stripe_payment_link_url)}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;background:var(--rose);color:#fff;text-decoration:none;
                      font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
                      padding:9px 20px;border-radius:5px;letter-spacing:0.01em;">
              Pay with card ↗
            </a>
            <p class="tax-note" style="margin:0;">
              Secure payment powered by Stripe.
              Include <strong>${escapeHtml(inv.invoice_number)}</strong> as your reference.
            </p>
          </div>`
        : `<p class="tax-note" style="margin-top:8px;">
            Please contact <strong>${orgName}</strong> for payment details.
            Include invoice number <strong>${escapeHtml(inv.invoice_number)}</strong> as your payment reference.
          </p>`
      }
    </div>

    <div class="terms-section">
      <div class="section-title">Terms &amp; conditions</div>
      <p class="terms-text">
        Payment is due by <strong>${dueDate}</strong>.
        Invoices unpaid after the due date may be subject to a late payment charge.
        Please include the invoice number as your payment reference.
        Disputes must be raised in writing within 7 days of receipt.
      </p>
    </div>

    <div class="footer">
      <div class="footer-txt">${orgName} · Generated via Severl · severl.app</div>
      <div class="footer-txt" style="text-align:right;">${escapeHtml(inv.invoice_number)} · ${invoiceDate}</div>
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
