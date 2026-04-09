"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth";
import type { OrgUIMeta } from "@/lib/database.types";
import { revalidatePath } from "next/cache";

/**
 * Marks a specific onboarding/milestone UI flag as seen.
 * Persists immediately to the orgs.ui_meta JSONB column in Supabase.
 */
export async function markUIMetaSeen(key: keyof OrgUIMeta) {
  try {
    const org = await getCurrentOrg();
    const currentMeta = org.ui_meta || {};
    
    if (currentMeta[key]) return; // already marked

    const newMeta = { ...currentMeta, [key]: true };
    
    // We use the admin client since auth and orgs modification is protected
    const supabase = getSupabaseAdminClient();
    
    const { error } = await supabase
      .from("orgs")
      .update({ ui_meta: newMeta })
      .eq("id", org.id);
      
    if (error) {
      console.error("Failed to update org UI meta:", error);
      return;
    }
    
    // Revalidatelayout to push updated state to server components
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Error in markUIMetaSeen:", err);
  }
}
