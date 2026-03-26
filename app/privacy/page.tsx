export const metadata = { title: "Privacy Policy — Severl" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy p-8 text-brand-white">
      <div className="max-w-2xl">
        <h1 className="mb-4 text-2xl font-medium">Privacy Policy</h1>
        <p className="text-sm leading-relaxed text-txt-secondary">
          Severl is currently in private beta. A full privacy policy will be published before public launch. If you have
          questions about how your data is handled, please contact us at privacy@severl.app.
        </p>
      </div>
    </div>
  );
}
