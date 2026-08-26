import { createClient } from "@/lib/supabase/client";

export async function hasAuthenticatedUser(): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();

  return Boolean(data?.claims);
}
