import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@severl.app';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function getWelcomeEmail(to: string) {
  return {
    to,
    subject: 'Welcome to Severl — Social Media Manager OS',
    html: `
      <p>Welcome to Severl 👋</p>
      <p>Your new command center for managing retainers, deliverables, and invoices is ready.</p>
      <p>Log in to start setting up your ${'social media'} business.</p>
    `,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set; skipping email send.');
    return;
  }

  await resend.emails.send({
    from: `Severl <${resendFromEmail}>`,
    to,
    subject,
    html,
  });
}

