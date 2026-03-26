"use client";

import dynamic from "next/dynamic";
import { Client360Skeleton } from "@/components/shared/Client360Skeleton";
import type { Client360ClientProps } from "./Client360Client";

const Client360Client = dynamic(() => import("./Client360Client"), {
  ssr: false,
  loading: () => <Client360Skeleton />,
});

export function Client360ClientLoader(props: Client360ClientProps) {
  return <Client360Client {...props} />;
}
