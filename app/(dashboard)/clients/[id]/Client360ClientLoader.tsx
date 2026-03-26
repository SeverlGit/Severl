"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { Client360Skeleton } from "@/components/shared/Client360Skeleton";

const Client360Client = dynamic(() => import("./Client360Client"), {
  ssr: false,
  loading: () => <Client360Skeleton />,
});

export function Client360ClientLoader(props: ComponentProps<typeof Client360Client>) {
  return <Client360Client {...props} />;
}
