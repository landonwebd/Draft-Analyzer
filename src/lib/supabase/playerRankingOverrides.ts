import type { PlayerRankingOverride, PlayerRankingOverrides } from "@/types/draft";
import { createClient } from "@/lib/supabase/client";

export async function loadDatabasePlayerRankingOverrides(): Promise<PlayerRankingOverrides> {
  const supabase = createClient();

  const { data, error } = await supabase.from("player_ranking_overrides").select(`
      playerKey:player_key,
      manualAdpAdjustment:manual_adp_adjustment,
      isExcluded:is_excluded
    `);

  if (error) {
    throw new Error(`Unable to load database player overrides: ${error.message}`);
  }

  return Object.fromEntries(
    data.map((override) => [
      override.playerKey,
      {
        manualAdpAdjustment: override.manualAdpAdjustment,
        isExcluded: override.isExcluded,
      },
    ]),
  );
}

export async function saveDatabasePlayerRankingOverride(playerKey: string, override: PlayerRankingOverride): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("player_ranking_overrides").upsert(
    {
      player_key: playerKey,
      manual_adp_adjustment: override.manualAdpAdjustment,
      is_excluded: override.isExcluded,
    },
    {
      onConflict: "user_id,player_key",
    },
  );

  if (error) {
    throw new Error(`Unable to save database player override: ${error.message}`);
  }
}

export async function deleteDatabasePlayerRankingOverride(playerKey: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("player_ranking_overrides").delete().eq("player_key", playerKey);

  if (error) {
    throw new Error(`Unable to delete database player override: ${error.message}`);
  }
}

export async function saveDatabasePlayerRankingOverrides(overrides: PlayerRankingOverrides): Promise<void> {
  const rows = Object.entries(overrides).map(([playerKey, override]) => ({
    player_key: playerKey,
    manual_adp_adjustment: override.manualAdpAdjustment,
    is_excluded: override.isExcluded,
  }));

  if (rows.length === 0) {
    return;
  }

  const supabase = createClient();

  const { error } = await supabase.from("player_ranking_overrides").upsert(rows, {
    onConflict: "user_id,player_key",
  });

  if (error) {
    throw new Error(`Unable to save database player overrides: ${error.message}`);
  }
}
