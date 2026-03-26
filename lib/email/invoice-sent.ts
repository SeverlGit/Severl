import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@severl.app';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendInvoiceSentEmail(params: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  billingMonth: string;
  orgName: string;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set; skipping invoice email send.');
    return;
  }

  try {
    const subject = `Invoice ${params.invoiceNumber} from ${params.orgName}`;
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(params.total);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:system-ui,-apple-system,sans-serif;color:#333;background:#fff;">
<div style="max-width:520px;margin:0 auto;">
  <p style="margin:0 0 1em;">Hi ${params.clientName},</p>
  <p style="margin:0 0 1em;">${params.orgName} has sent you invoice ${params.invoiceNumber} for ${params.billingMonth}.</p>
  <p style="margin:0 0 1em;"><strong>Amount due:</strong> ${formattedTotal}</p>
  <p style="margin:0 0 1em;"><strong>Due by:</strong> ${params.dueDate}</p>
  <p style="margin:0 0 1em;">If you have any questions, please reach out to your account manager.</p>
  <p style="margin:2em 0 0;font-size:12px;color:#666;">Sent via Severl</p>
</div>
</body>
</html>
`.trim();

    await resend.emails.send({
      from: `Severl <${resendFromEmail}>`,
      to: params.to,
      subject,
      html,
    });
  } catch (err) {
    Sentry.captureException(err);
  }
}
