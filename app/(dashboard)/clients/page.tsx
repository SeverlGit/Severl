import React from "react";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import { getClients } from "@/lib/clients/getClientsData";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientSearchInput } from "@/components/clients/ClientSearchInput";

type Props = {
  searchParams: Promise<{
    filter?: string;
    search?: string;
  }>;
};

const TAG_ORDER = ["all", "active", "at_risk", "prospect", "onboarding", "paused", "churned"] as const;

export default async function ClientsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const org = await getCurrentOrg();
  const vertical = getVerticalConfig(org.vertical);

  const filter = (sp.filter as string) || "all";
  const search = sp.search || "";

  const clients = await getClients(org.id, filter, search);

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-medium text-txt-primary">
            {vertical.crm.rosterLabel}
          </h1>
          <p className="text-sm text-txt-muted">
            Keep your {vertical.crm.clientsLabel.toLowerCase()} organized and see who&apos;s at risk.
          </p>
        </div>
        <AddClientDialog orgId={org.id} verticalSlug={org.vertical} verticalConfig={vertical} />
      </header>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface px-3.5 py-3.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <ClientSearchInput
            search={search}
            filter={filter}
            placeholder={`Search by brand, ${vertical.crm.contactLabel.toLowerCase()}, or email`}
          />
          <div className="flex gap-1 overflow-x-auto text-[14px] uppercase tracking-[0.04em] text-[rgba(160,152,144,0.75)]">
            {TAG_ORDER.map((tag) => {
              const label =
                tag === "all"
                  ? "All"
                  : tag === "onboarding"
                    ? "Onboarding"
                    : tag.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const isActive = filter === tag;
              const params = new URLSearchParams();
              if (tag !== "all") params.set("filter", tag);
              if (search) params.set("search", search);
              const href =
                params.toString().length > 0
                  ? `/clients?${params.toString()}`
                  : "/clients";

              return (
                <a
                  key={tag}
                  href={href}
                  className={`border-b px-2 py-1 transition-colors ${
                    isActive
                      ? "border-brand-rose text-brand-rose-deep"
                      : "border-transparent text-txt-muted hover:text-txt-secondary"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>

        <ClientTable
          clients={clients}
          filter={filter}
          orgId={org.id}
          verticalSlug={org.vertical}
          showAccountManager={vertical.crm.profileSections.includes("team")}
          emptyStateAction={
            (filter === "all" || !filter) && (
              <AddClientDialog
                orgId={org.id}
                verticalSlug={org.vertical}
                verticalConfig={vertical}
                trigger={
                  <button
                    type="button"
                    className="rounded bg-brand-rose px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-rose-deep"
                  >
                    Add your first client
                  </button>
                }
              />
            )
          }
        />
      </div>
    </div>
  );
}
