"use client";

import dynamic from "next/dynamic";
import { InvoicesSkeleton } from "@/components/shared/InvoicesSkeleton";
import type { InvoicesClientProps } from "./InvoicesClient";

const InvoicesClient = dynamic(() => import("./InvoicesClient"), {
  ssr: false,
  loading: () => <InvoicesSkeleton />,
});

export function InvoicesClientLoader(props: InvoicesClientProps) {
  return <InvoicesClient {...props} />;
}
