export const metadata = { title: "Terms of Service — Severl" };

export default function TermsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy p-8 text-brand-white">
      <div className="max-w-2xl">
        <h1 className="mb-4 text-2xl font-medium">Terms of Service</h1>
        <p className="text-sm leading-relaxed text-txt-secondary">
          Severl is currently in private beta. Full terms of service will be published before public launch. By using this
          beta, you acknowledge that the service is provided as-is for evaluation purposes.
        </p>
      </div>
    </div>
  );
}
