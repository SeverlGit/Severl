import React from "react";
import Link from "next/link";

export const metadata = { title: "Privacy Policy — Severl" };

const LAST_UPDATED = "April 8, 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="mb-3 font-display text-[18px] font-medium text-txt-primary">{title}</h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-txt-secondary">{children}</div>
    </section>
  );
}

const TOC = [
  { id: "information", label: "Information We Collect" },
  { id: "use",         label: "How We Use Your Information" },
  { id: "sharing",     label: "Sharing & Disclosure" },
  { id: "retention",   label: "Data Retention" },
  { id: "security",    label: "Security" },
  { id: "rights",      label: "Your Rights" },
  { id: "cookies",     label: "Cookies" },
  { id: "children",    label: "Children's Privacy" },
  { id: "changes",     label: "Changes to This Policy" },
  { id: "contact",     label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-4xl px-6 py-16">

        {/* Header */}
        <div className="mb-12 border-b border-border pb-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-[12px] text-txt-muted hover:text-txt-secondary transition-colors">
            ← Back to Severl
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-[15px] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #C4909A 0%, #6B6178 100%)" }}
            >
              S
            </div>
            <span className="font-sans text-[15px] font-semibold text-txt-primary">Severl</span>
          </div>
          <h1 className="mt-5 font-display text-[36px] font-medium leading-tight text-txt-primary">
            Privacy Policy
          </h1>
          <p className="mt-2 text-[13px] text-txt-muted">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-txt-secondary">
            Severl (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a social media management operating
            system for freelancers and agencies. This Privacy Policy explains how we collect, use, and protect your
            personal information when you use our service at severl.app.
          </p>
        </div>

        <div className="flex gap-12">

          {/* Table of contents — sticky sidebar */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-txt-muted">Contents</p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-[12px] text-txt-muted transition-colors hover:text-txt-primary py-0.5"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-10 min-w-0">

            <Section id="information" title="1. Information We Collect">
              <p><strong className="text-txt-primary">Account information.</strong> When you create an account via Clerk, we collect your name, email address, and profile photo. Authentication is handled by Clerk (clerk.com) — we do not store passwords.</p>
              <p><strong className="text-txt-primary">Business data.</strong> Information you enter into Severl — client names, contact details, retainer amounts, invoice data, deliverable notes, and related content — is stored in our database (Supabase/PostgreSQL) and is owned by you.</p>
              <p><strong className="text-txt-primary">Billing information.</strong> Payment and subscription data is processed and stored by Stripe. We store only a Stripe customer ID and your current plan tier — we never store full card numbers or CVCs.</p>
              <p><strong className="text-txt-primary">Usage data.</strong> We collect events such as invoices created, deliverables updated, and clients added. This data is used solely to populate your own analytics dashboards and is scoped to your organisation.</p>
              <p><strong className="text-txt-primary">Technical data.</strong> Standard server logs, error reports (via Sentry), and browser information may be collected for diagnostics and security purposes.</p>
            </Section>

            <Section id="use" title="2. How We Use Your Information">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To provide, operate, and maintain the Severl platform</li>
                <li>To process subscription payments through Stripe</li>
                <li>To send transactional emails (invoice notifications, account verification) via Resend</li>
                <li>To power your in-app analytics dashboard</li>
                <li>To diagnose bugs and improve reliability (Sentry error tracking)</li>
                <li>To communicate important service or policy updates</li>
              </ul>
              <p>We do not sell your data. We do not use your business data to train AI models or share it with advertisers.</p>
            </Section>

            <Section id="sharing" title="3. Sharing & Disclosure">
              <p>We share your information only with the following categories of service providers, strictly to operate the platform:</p>
              <div className="rounded-md border border-border bg-surface overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead className="bg-surface-hover">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-txt-muted">Provider</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-txt-muted">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Clerk",   "Authentication & user identity"],
                      ["Supabase","Database & file storage"],
                      ["Stripe",  "Payment processing & subscriptions"],
                      ["Resend",  "Transactional email delivery"],
                      ["Sentry",  "Error monitoring & diagnostics"],
                      ["Vercel",  "Hosting & edge delivery"],
                    ].map(([provider, purpose]) => (
                      <tr key={provider}>
                        <td className="px-4 py-2.5 font-medium text-txt-primary">{provider}</td>
                        <td className="px-4 py-2.5 text-txt-secondary">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>We may also disclose information if required by law or to protect our legal rights.</p>
            </Section>

            <Section id="retention" title="4. Data Retention">
              <p>We retain your account and business data for as long as your account is active. If you delete your account, your data is purged within 30 days, except where retention is required by law (e.g. financial records).</p>
              <p>Stripe retains billing records independently for compliance purposes — refer to Stripe&apos;s privacy policy for details.</p>
            </Section>

            <Section id="security" title="5. Security">
              <p>All data is encrypted in transit (TLS) and at rest. Database access is governed by row-level security (RLS) — your data is strictly scoped to your organisation and cannot be accessed by other users.</p>
              <p>Authentication tokens are managed by Clerk and never stored in our database. Stripe handles all payment credentials under PCI-DSS compliance.</p>
              <p>Despite these measures, no system is 100% secure. We encourage you to use a strong password and notify us immediately at <a href="mailto:security@severl.app" className="text-brand-rose hover:underline">security@severl.app</a> if you suspect unauthorised access.</p>
            </Section>

            <Section id="rights" title="6. Your Rights">
              <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-txt-primary">Access</strong> — request a copy of the data we hold about you</li>
                <li><strong className="text-txt-primary">Correction</strong> — update inaccurate information via your account settings</li>
                <li><strong className="text-txt-primary">Deletion</strong> — request deletion of your account and associated data</li>
                <li><strong className="text-txt-primary">Portability</strong> — request an export of your business data in a machine-readable format</li>
                <li><strong className="text-txt-primary">Objection</strong> — object to certain types of processing</li>
              </ul>
              <p>To exercise any of these rights, contact us at <a href="mailto:privacy@severl.app" className="text-brand-rose hover:underline">privacy@severl.app</a>. We will respond within 30 days.</p>
            </Section>

            <Section id="cookies" title="7. Cookies">
              <p>Severl uses only functional cookies necessary to operate the service — primarily session tokens managed by Clerk. We do not use advertising or tracking cookies.</p>
            </Section>

            <Section id="children" title="8. Children's Privacy">
              <p>Severl is intended for business use by individuals aged 18 or older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has created an account, contact us and we will delete it promptly.</p>
            </Section>

            <Section id="changes" title="9. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect. Continued use of Severl after the effective date constitutes acceptance of the updated policy.</p>
            </Section>

            <Section id="contact" title="10. Contact">
              <p>If you have questions or concerns about this Privacy Policy or how we handle your data, please contact:</p>
              <div className="rounded-md border border-border bg-surface px-4 py-3 text-[13px]">
                <p className="font-medium text-txt-primary">Severl Privacy Team</p>
                <p className="mt-1 text-txt-secondary">Email: <a href="mailto:privacy@severl.app" className="text-brand-rose hover:underline">privacy@severl.app</a></p>
              </div>
            </Section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-border pt-8 flex items-center justify-between text-[12px] text-txt-hint">
          <span>© {new Date().getFullYear()} Severl. All rights reserved.</span>
          <Link href="/terms" className="hover:text-txt-muted transition-colors">Terms of Service</Link>
        </div>

      </div>
    </div>
  );
}
