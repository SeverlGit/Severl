import React from "react";
import Link from "next/link";

export const metadata = { title: "Terms of Service — Severl" };

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
  { id: "acceptance",     label: "Acceptance of Terms" },
  { id: "service",        label: "Description of Service" },
  { id: "accounts",       label: "Accounts & Access" },
  { id: "subscriptions",  label: "Subscriptions & Billing" },
  { id: "refunds",        label: "Refund Policy" },
  { id: "invoices",       label: "Invoice & Tax Policy" },
  { id: "data",           label: "Your Data" },
  { id: "conduct",        label: "Acceptable Use" },
  { id: "ip",             label: "Intellectual Property" },
  { id: "disclaimers",    label: "Disclaimers" },
  { id: "liability",      label: "Limitation of Liability" },
  { id: "termination",    label: "Termination" },
  { id: "changes",        label: "Changes to Terms" },
  { id: "governing",      label: "Governing Law" },
  { id: "contact",        label: "Contact" },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-[13px] text-txt-muted">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-txt-secondary">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Severl, a social media
            management operating system operated by Severl (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;).
            By creating an account or using the service, you agree to these Terms in full.
          </p>
        </div>

        <div className="flex gap-12">

          {/* Table of contents */}
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

            <Section id="acceptance" title="1. Acceptance of Terms">
              <p>By accessing or using Severl, you confirm that you are at least 18 years old, have the legal authority to enter into these Terms, and agree to be bound by them. If you are using Severl on behalf of a business or organisation, you represent that you have authority to bind that entity.</p>
              <p>If you do not agree to these Terms, you must not use Severl.</p>
            </Section>

            <Section id="service" title="2. Description of Service">
              <p>Severl is a subscription-based SaaS platform that provides social media managers, freelancers, and agencies with tools to manage clients, track deliverables, and create and send invoices. Features vary by subscription plan.</p>
              <p>We reserve the right to modify, suspend, or discontinue any part of the service at any time, with reasonable notice where practicable.</p>
            </Section>

            <Section id="accounts" title="3. Accounts & Access">
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately at <a href="mailto:support@severl.app" className="text-brand-rose hover:underline">support@severl.app</a> if you suspect unauthorised access.</p>
              <p>Each account may represent one organisation. You may not share account access with individuals outside your organisation or use a single account on behalf of multiple unrelated businesses.</p>
            </Section>

            <Section id="subscriptions" title="4. Subscriptions & Billing">
              <p>Severl offers the following subscription plans:</p>
              <div className="rounded-md border border-border bg-surface overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead className="bg-surface-hover">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-txt-muted">Plan</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-txt-muted">Price</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-txt-muted">Billing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Essential", "Free",  "N/A"],
                      ["Pro",       "$29",   "Monthly"],
                      ["Elite",     "$79",   "Monthly"],
                      ["Agency",    "$99",   "Monthly"],
                    ].map(([plan, price, billing]) => (
                      <tr key={plan}>
                        <td className="px-4 py-2.5 font-medium text-txt-primary">{plan}</td>
                        <td className="px-4 py-2.5 text-txt-secondary">{price}</td>
                        <td className="px-4 py-2.5 text-txt-secondary">{billing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>All paid subscriptions are billed monthly in advance. Your subscription renews automatically on the same day each month unless cancelled before the renewal date. Payments are processed by Stripe. By subscribing, you authorise Stripe to charge your payment method on a recurring basis.</p>
              <p>We reserve the right to change subscription prices with at least 30 days&apos; notice. Price changes will not apply to your current billing period — they take effect on your next renewal.</p>
            </Section>

            <Section id="refunds" title="5. Refund Policy">
              <div className="rounded-md border border-warning/30 bg-warning-bg px-4 py-3">
                <p className="font-semibold text-txt-primary">All subscription payments are non-refundable.</p>
              </div>
              <p>When you purchase a paid plan, you are paying for immediate access to the full feature set of that plan for the current billing period. We do not issue prorated refunds for unused time if you cancel mid-period, downgrade your plan, or close your account.</p>
              <p><strong className="text-txt-primary">Cancellation.</strong> You may cancel your subscription at any time through your account settings or the Stripe billing portal. Upon cancellation, you will retain full access to your plan until the end of the current paid billing period. Your account will then revert to the free Essential plan — your data will not be deleted.</p>
              <p>We may, at our sole discretion, issue credits or exceptions in cases of documented technical failure on our part. Requests must be submitted within 7 days of the affected billing date to <a href="mailto:support@severl.app" className="text-brand-rose hover:underline">support@severl.app</a>.</p>
            </Section>

            <Section id="invoices" title="6. Invoice & Tax Policy">
              <p><strong className="text-txt-primary">Platform invoices (Severl → you).</strong> Stripe generates receipts for your Severl subscription. These receipts are available in your Stripe billing portal. Severl does not currently collect or remit sales tax on subscription fees — you are responsible for determining whether any applicable taxes apply in your jurisdiction.</p>

              <p><strong className="text-txt-primary">Client invoices (you → your clients).</strong> Severl provides tools for you to create and send invoices to your own clients. These features are provided as productivity tools only.</p>

              <div className="rounded-md border border-brand-plum/20 bg-brand-plum-dim px-4 py-3 space-y-2">
                <p className="font-semibold text-txt-primary">Important tax disclaimer</p>
                <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-txt-secondary">
                  <li>Severl does not calculate, apply, collect, or remit taxes on invoices you generate for your clients.</li>
                  <li>Whether GST, VAT, sales tax, or any other tax applies to your services depends on your jurisdiction, your clients&apos; jurisdictions, and the nature of your services.</li>
                  <li>You are solely responsible for determining your tax obligations, applying the correct tax rates to your invoices, collecting taxes from your clients where required, and remitting those taxes to the appropriate tax authority.</li>
                  <li>Invoice amounts displayed in Severl do not include tax unless you manually add tax line items.</li>
                  <li>Severl does not provide tax advice. Consult a qualified accountant or tax professional for guidance specific to your situation.</li>
                </ul>
              </div>

              <p><strong className="text-txt-primary">Invoice records.</strong> Invoice data you create in Severl is stored in your account and remains accessible for the lifetime of your account. We recommend exporting or backing up invoice records independently — Severl is a management tool, not an official accounting system.</p>
            </Section>

            <Section id="data" title="7. Your Data">
              <p>You retain full ownership of all business data you enter into Severl — client records, invoice data, deliverables, and notes. We do not claim any rights over your content.</p>
              <p>By using Severl, you grant us a limited licence to store and process your data solely for the purpose of operating the service. This licence ends when you delete your account.</p>
              <p>See our <Link href="/privacy" className="text-brand-rose hover:underline">Privacy Policy</Link> for full details on how we handle your data.</p>
            </Section>

            <Section id="conduct" title="8. Acceptable Use">
              <p>You agree not to use Severl to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Violate any applicable law or regulation</li>
                <li>Store or transmit any content that is unlawful, fraudulent, or abusive</li>
                <li>Attempt to gain unauthorised access to any part of the service or another user&apos;s data</li>
                <li>Reverse-engineer, decompile, or copy any part of the platform</li>
                <li>Use the service in any way that could damage, overburden, or impair its operation</li>
                <li>Resell or sublicence access to Severl without written authorisation</li>
              </ul>
              <p>Violation of these terms may result in immediate account suspension or termination without refund.</p>
            </Section>

            <Section id="ip" title="9. Intellectual Property">
              <p>All software, design, trademarks, and content comprising the Severl platform (excluding your user data) are owned by or licenced to Severl. Nothing in these Terms grants you any rights in the Severl platform beyond the limited right to use the service as described herein.</p>
            </Section>

            <Section id="disclaimers" title="10. Disclaimers">
              <p>Severl is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.</p>
              <p>We do not warrant that the service will be error-free, that data will never be lost, or that the service will meet your specific business requirements.</p>
            </Section>

            <Section id="liability" title="11. Limitation of Liability">
              <p>To the maximum extent permitted by applicable law, Severl and its officers, employees, and contractors shall not be liable for any indirect, incidental, consequential, or punitive damages — including but not limited to loss of revenue, loss of data, or loss of clients — arising from your use of or inability to use the service.</p>
              <p>Our total aggregate liability for any claim arising out of these Terms shall not exceed the amount you paid to Severl in the 12 months preceding the claim.</p>
            </Section>

            <Section id="termination" title="12. Termination">
              <p><strong className="text-txt-primary">By you.</strong> You may close your account at any time by contacting support or using the account deletion flow. Cancellation of a paid subscription does not delete your account — see Section 5 for cancellation terms.</p>
              <p><strong className="text-txt-primary">By us.</strong> We may suspend or terminate your account if you materially breach these Terms, if required by law, or if we discontinue the service. We will provide reasonable notice except where immediate termination is required for security or legal reasons.</p>
              <p>Upon termination, your right to use the service ceases immediately. Sections 7, 9, 10, 11, and 13 survive termination.</p>
            </Section>

            <Section id="changes" title="13. Changes to Terms">
              <p>We may update these Terms from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect. Your continued use of Severl after the effective date constitutes acceptance of the revised Terms.</p>
            </Section>

            <Section id="governing" title="14. Governing Law">
              <p>These Terms are governed by the laws of the jurisdiction in which Severl operates, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of that jurisdiction, and you consent to personal jurisdiction therein.</p>
            </Section>

            <Section id="contact" title="15. Contact">
              <p>For questions about these Terms, contact us at:</p>
              <div className="rounded-md border border-border bg-surface px-4 py-3 text-[13px]">
                <p className="font-medium text-txt-primary">Severl Support</p>
                <p className="mt-1 text-txt-secondary">Email: <a href="mailto:support@severl.app" className="text-brand-rose hover:underline">support@severl.app</a></p>
              </div>
            </Section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-border pt-8 flex items-center justify-between text-[12px] text-txt-hint">
          <span>© {new Date().getFullYear()} Severl. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-txt-muted transition-colors">Privacy Policy</Link>
        </div>

      </div>
    </div>
  );
}
