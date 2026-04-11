import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@severl.app';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * sendInvoiceReminderEmail — 7-day overdue nudge.
 * Friendly tone: "just a quick reminder".
 */
export async function sendInvoiceReminderEmail(params: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  orgName: string;
  paymentLinkUrl?: string | null;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set; skipping invoice reminder email.');
    return;
  }

  try {
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(params.total);

    const paymentSection = params.paymentLinkUrl
      ? `<p style="margin:0 0 1em;"><a href="${params.paymentLinkUrl}" style="display:inline-block;background:#e85d75;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Pay with card →</a></p>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:system-ui,-apple-system,sans-serif;color:#333;background:#fff;">
<div style="max-width:520px;margin:0 auto;">
  <p style="margin:0 0 1em;">Hi ${params.clientName},</p>
  <p style="margin:0 0 1em;">Just a quick reminder — invoice ${params.invoiceNumber} from ${params.orgName} is now overdue.</p>
  <p style="margin:0 0 1em;"><strong>Amount due:</strong> ${formattedTotal}</p>
  <p style="margin:0 0 1em;"><strong>Original due date:</strong> ${params.dueDate}</p>
  ${paymentSection}
  <p style="margin:0 0 1em;">If you have any questions or need to make arrangements, please reach out to your account manager.</p>
  <p style="margin:2em 0 0;font-size:12px;color:#666;">Sent via Severl</p>
</div>
</body>
</html>
`.trim();

    await resend.emails.send({
      from: `Severl <${resendFromEmail}>`,
      to: params.to,
      subject: `Reminder: Invoice ${params.invoiceNumber} is overdue`,
      html,
    });
  } catch (err) {
    Sentry.captureException(err);
  }
}
