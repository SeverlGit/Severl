/**
 * Verification email template.
 *
 * Usage with Clerk custom email provider (Resend):
 *  - Configure Resend as a connected email provider in the Clerk Dashboard.
 *  - Clerk will call your /api/clerk/email webhook; render this template and
 *    send it via resend.emails.send().
 *
 * Alternatively, copy the rendered HTML into Clerk Dashboard → Emails → Verification.
 */
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';

const resendApiKey    = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@severl.app';
const appUrl          = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.severl.app';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function getVerificationEmail({
  to,
  code,
  verificationUrl,
}: {
  to: string;
  code: string;
  verificationUrl: string;
}) {
  const privacyUrl     = `${appUrl}/privacy`;
  const termsUrl       = `${appUrl}/terms`;
  const unsubscribeUrl = `${appUrl}/unsubscribe`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Verify your Severl account</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    .preview-text { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding  { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F0EBE3;font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;">

  <span class="preview-text">
    Verify your email to finish setting up your Severl workspace. &#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;&#x200C;
  </span>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
         style="background-color:#F0EBE3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0"
               border="0" width="560" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#C4909A 0%,#6B6178 100%);display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:500;color:#ffffff;line-height:34px;text-align:center;">S</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:400;color:#1A1714;letter-spacing:-0.01em;">Severl</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#FFFFFF;border:1px solid #DDD7CE;border-radius:12px;overflow:hidden;">
              <!-- Rose accent strip -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="height:3px;background-color:#C4909A;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <!-- Card body -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="mobile-padding" style="padding:40px 48px 36px;">

                    <!-- Headline -->
                    <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1714;line-height:1.15;letter-spacing:-0.02em;">Verify your email</p>

                    <!-- Subhead -->
                    <p style="margin:0 0 28px;font-size:13px;color:#A09890;line-height:1.6;font-weight:400;">
                      You&rsquo;re almost set up. Confirm your email address to activate your
                      Severl workspace and start managing your practice.
                    </p>

                    <!-- Divider -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr><td style="height:1px;background:#E8E2D9;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Code block -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0;">
                      <tr>
                        <td align="center">
                          <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:#A09890;">Your verification code</p>
                          <div style="display:inline-block;background-color:#F7ECED;border:1px solid rgba(196,144,154,0.25);border-radius:10px;padding:18px 36px;">
                            <span style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;color:#1A1714;letter-spacing:0.18em;font-variant-numeric:tabular-nums;">${code}</span>
                          </div>
                          <p style="margin:12px 0 0;font-size:11px;color:#C4BAB0;font-weight:400;">Expires in 10 minutes</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr><td style="height:1px;background:#E8E2D9;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Or use button -->
                    <p style="margin:24px 0 16px;font-size:12px;color:#A09890;text-align:center;font-weight:400;">Or click the button below to verify instantly</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${verificationUrl}"
                             style="display:inline-block;background-color:#C4909A;color:#ffffff;font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;padding:12px 36px;border-radius:8px;letter-spacing:0.01em;"
                          >Verify my email</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security note -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:28px;">
                      <tr>
                        <td style="background-color:#FAF7F4;border:1px solid #E8E2D9;border-radius:8px;padding:14px 16px;">
                          <p style="margin:0;font-size:11.5px;color:#A09890;line-height:1.55;">
                            <strong style="color:#6B6560;font-weight:600;">Didn&rsquo;t request this?</strong>
                            You can safely ignore this email. Someone may have entered your email
                            address by mistake. Your account won&rsquo;t be created unless you verify.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${privacyUrl}" style="font-size:11px;color:#C4BAB0;text-decoration:none;margin:0 8px;">Privacy</a>
                    <span style="font-size:11px;color:#C4BAB0;">&middot;</span>
                    <a href="${termsUrl}" style="font-size:11px;color:#C4BAB0;text-decoration:none;margin:0 8px;">Terms</a>
                    <span style="font-size:11px;color:#C4BAB0;">&middot;</span>
                    <a href="${unsubscribeUrl}" style="font-size:11px;color:#C4BAB0;text-decoration:none;margin:0 8px;">Unsubscribe</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:11px;color:#C4BAB0;line-height:1.6;">
                      Severl Inc. &middot; Built for social media managers.<br />
                      This email was sent to
                      <a href="mailto:${to}" style="color:#C4BAB0;text-decoration:underline;">${to}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return {
    to,
    subject: 'Verify your Severl account',
    html,
  };
}

export async function sendVerificationEmail(params: {
  to: string;
  code: string;
  verificationUrl: string;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set; skipping verification email send.');
    return;
  }

  try {
    const { to, subject, html } = getVerificationEmail(params);
    await resend.emails.send({
      from: `Severl <${resendFromEmail}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    Sentry.captureException(err);
  }
}
