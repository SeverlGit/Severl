"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { InvoicesSkeleton } from "@/components/shared/InvoicesSkeleton";

const InvoicesClient = dynamic(() => import("./InvoicesClient"), {
  ssr: false,
  loading: () => <InvoicesSkeleton />,
});

export function InvoicesClientLoader(props: ComponentProps<typeof InvoicesClient>) {
  return <InvoicesClient {...props} />;
}
