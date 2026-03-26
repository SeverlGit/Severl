import React from "react";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orgs")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    Sentry.captureException(error, { extra: { context: "OnboardingPage", step: "checkExistingOrg" } });
  }

  if (data) {
    redirect("/");
  }

  return <OnboardingClient />;
}
