import type { DraftPool } from "@/types/draft";
import { createClient } from "@/lib/supabase/client";

export async function loadDatabaseDraftPools(): Promise<DraftPool[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("draft_pools").select("id, name").order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load database draft pools: ${error.message}`);
  }

  return data;
}

export async function createDatabaseDraftPool(name: string, slug: string): Promise<DraftPool> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("draft_pools")
    .insert({
      name,
      slug,
    })
    .select("id, name")
    .single();

  if (error) {
    throw new Error(`Unable to create database draft pool: ${error.message}`);
  }

  return data;
}

export async function renameDatabaseDraftPool(draftPoolId: string, name: string, slug: string): Promise<DraftPool> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("draft_pools")
    .update({
      name,
      slug,
    })
    .eq("id", draftPoolId)
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Unable to rename database draft pool: ${error?.message ?? "Pool not found."}`);
  }

  return data;
}

export async function deleteDatabaseDraftPool(draftPoolId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.from("draft_pools").delete().eq("id", draftPoolId).select("id").maybeSingle();

  if (error || !data) {
    throw new Error(`Unable to delete database draft pool: ${error?.message ?? "Pool not found."}`);
  }
}
