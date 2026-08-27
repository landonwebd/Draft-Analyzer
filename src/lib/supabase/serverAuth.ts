import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    return null;
  }

  return data.claims.sub;
}
