import type { DraftPick, ImportedDraft } from "@/types/draft";
import { createClient } from "@/lib/supabase/client";

export async function loadDatabaseImportedDrafts(): Promise<ImportedDraft[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("imported_drafts")
    .select(
      `
      id,
      name,
      sourceFileName:source_file_name,
      importedAt:imported_at,
      myFantasyTeam:my_fantasy_team,
      poolId:pool_id,
      picks:draft_picks (
        overall,
        pick,
        playerName:player_name,
        position,
        nflTeam:nfl_team,
        fantasyTeam:fantasy_team
      )
    `,
    )
    .order("imported_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load database imported drafts: ${error.message}`);
  }

  return data.map((draft) => ({
    id: draft.id,
    name: draft.name,
    sourceFileName: draft.sourceFileName,
    importedAt: draft.importedAt,
    myFantasyTeam: draft.myFantasyTeam,
    poolId: draft.poolId ?? undefined,
    picks: draft.picks
      .map((pick) => ({
        ...pick,
        position: pick.position as DraftPick["position"],
      }))
      .sort((firstPick, secondPick) => firstPick.overall - secondPick.overall),
  }));
}

export async function createDatabaseImportedDraft(draft: ImportedDraft): Promise<ImportedDraft> {
  const supabase = createClient();

  const { error } = await supabase.from("imported_drafts").insert({
    id: draft.id,
    name: draft.name,
    source_file_name: draft.sourceFileName,
    imported_at: draft.importedAt,
    my_fantasy_team: draft.myFantasyTeam,
    pool_id: draft.poolId ?? null,
  });

  if (error) {
    throw new Error(`Unable to create database imported draft: ${error.message}`);
  }

  const { error: picksError } = await supabase.from("draft_picks").insert(
    draft.picks.map((pick) => ({
      draft_id: draft.id,
      overall: pick.overall,
      pick: pick.pick,
      player_name: pick.playerName,
      position: pick.position,
      nfl_team: pick.nflTeam ?? "",
      fantasy_team: pick.fantasyTeam,
    })),
  );

  if (picksError) {
    const { error: cleanupError } = await supabase.from("imported_drafts").delete().eq("id", draft.id);
    if (cleanupError) {
      throw new Error(`Unable to create database draft picks: ${picksError.message}. ` + `The incomplete draft could not be removed: ${cleanupError.message}`);
    }
    throw new Error(`Unable to create database draft picks: ${picksError.message}`);
  }

  return draft;
}

export async function deleteDatabaseImportedDraft(draftId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.from("imported_drafts").delete().eq("id", draftId).select("id").maybeSingle();

  if (error || !data) {
    throw new Error(`Unable to delete database imported draft: ${error?.message ?? "Draft not found."}`);
  }
}

export async function assignDatabaseImportedDraftToPool(draftId: string, poolId: string | undefined): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("imported_drafts")
    .update({
      pool_id: poolId ?? null,
    })
    .eq("id", draftId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Unable to assign database imported draft to pool: ${error?.message ?? "Draft not found."}`);
  }
}

export async function deleteDatabaseImportedDrafts(draftIds: string[]): Promise<void> {
  if (draftIds.length === 0) {
    return;
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("imported_drafts").delete().in("id", draftIds).select("id");
  if (error) {
    throw new Error(`Unable to delete all database imported drafts: ${error.message}`);
  }
  if (data.length !== draftIds.length) {
    throw new Error("Unable to delete all database imported drafts: Some drafts were not found.");
  }
}

export async function renameDatabaseImportedDraft(draftId: string, name: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("imported_drafts")
    .update({
      name,
    })
    .eq("id", draftId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Unable to rename database imported draft: ${error?.message ?? "Draft not found."}`);
  }
}
