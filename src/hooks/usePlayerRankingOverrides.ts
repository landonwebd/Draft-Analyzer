"use client";

import { useEffect, useState } from "react";
import type { PlayerRankingOverride, PlayerRankingOverrides } from "@/types/draft";
import { MANUAL_ADP_ADJUSTMENT_MAX, MANUAL_ADP_ADJUSTMENT_MIN, PLAYER_RANKING_OVERRIDES_STORAGE_KEY } from "@/utils/playerRankingOverrideStorage";
import { deleteDatabasePlayerRankingOverride, loadDatabasePlayerRankingOverrides, saveDatabasePlayerRankingOverride, saveDatabasePlayerRankingOverrides } from "@/lib/supabase/playerRankingOverrides";
import { hasAuthenticatedUser } from "@/lib/supabase/auth";
import { retryJwtIssuedAtFuture } from "@/lib/supabase/retryJwtIssuedAtFuture";

function isPlayerRankingOverride(value: unknown): value is PlayerRankingOverride {
  return typeof value === "object" && value !== null && "manualAdpAdjustment" in value && typeof value.manualAdpAdjustment === "number" && Number.isFinite(value.manualAdpAdjustment) && value.manualAdpAdjustment >= MANUAL_ADP_ADJUSTMENT_MIN && value.manualAdpAdjustment <= MANUAL_ADP_ADJUSTMENT_MAX && "isExcluded" in value && typeof value.isExcluded === "boolean";
}

function isPlayerRankingOverrides(value: unknown): value is PlayerRankingOverrides {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(isPlayerRankingOverride);
}

export function usePlayerRankingOverrides() {
  const [overrides, setOverrides] = useState<PlayerRankingOverrides>({});
  const [hasLoadedOverrides, setHasLoadedOverrides] = useState(false);
  const [overrideStorage, setOverrideStorage] = useState<"guest" | "database" | null>(null);

  useEffect(() => {
    let wasCancelled = false;

    async function loadOverrides() {
      try {
        let browserOverrides: PlayerRankingOverrides = {};

        const storedValue = window.localStorage.getItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY);

        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);

          if (isPlayerRankingOverrides(parsedValue)) {
            browserOverrides = parsedValue;
          }
        }

        const userIsAuthenticated = await hasAuthenticatedUser();

        if (wasCancelled) {
          return;
        }

        if (!userIsAuthenticated) {
          setOverrideStorage("guest");
          setOverrides(browserOverrides);
          return;
        }

        setOverrideStorage("database");

        const databaseOverrides = await retryJwtIssuedAtFuture(loadDatabasePlayerRankingOverrides);

        const mergedOverrides = {
          ...databaseOverrides,
          ...browserOverrides,
        };

        if (!wasCancelled) {
          setOverrides(mergedOverrides);
        }

        if (Object.keys(browserOverrides).length > 0) {
          await retryJwtIssuedAtFuture(() => saveDatabasePlayerRankingOverrides(browserOverrides));

          window.localStorage.removeItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Unable to load player ranking overrides:", error);
      } finally {
        if (!wasCancelled) {
          setHasLoadedOverrides(true);
        }
      }
    }

    void loadOverrides();

    return () => {
      wasCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedOverrides || overrideStorage !== "guest") {
      return;
    }
    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides, hasLoadedOverrides, overrideStorage]);

  async function updateOverride(playerKey: string, override: PlayerRankingOverride): Promise<void> {
    if (overrideStorage === null) {
      return;
    }

    const isDefaultOverride = override.manualAdpAdjustment === 0 && !override.isExcluded;

    if (overrideStorage === "database") {
      try {
        if (isDefaultOverride) {
          await retryJwtIssuedAtFuture(() => deleteDatabasePlayerRankingOverride(playerKey));
        } else {
          await retryJwtIssuedAtFuture(() => saveDatabasePlayerRankingOverride(playerKey, override));
        }
      } catch (error) {
        console.error("Unable to update player ranking override:", error);
        return;
      }
    }

    setOverrides((currentOverrides) => {
      const nextOverrides = {
        ...currentOverrides,
      };

      if (isDefaultOverride) {
        delete nextOverrides[playerKey];
      } else {
        nextOverrides[playerKey] = override;
      }

      return nextOverrides;
    });
  }

  return {
    overrides,
    hasLoadedOverrides,
    updateOverride,
  };
}
