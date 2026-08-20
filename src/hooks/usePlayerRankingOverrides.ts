"use client";

import { useEffect, useState } from "react";
import type { PlayerRankingOverride, PlayerRankingOverrides } from "@/types/draft";
import { PLAYER_RANKING_OVERRIDES_STORAGE_KEY } from "@/utils/playerRankingOverrideStorage";

function isPlayerRankingOverride(value: unknown): value is PlayerRankingOverride {
  return typeof value === "object" && value !== null && "manualAdpAdjustment" in value && typeof value.manualAdpAdjustment === "number" && Number.isFinite(value.manualAdpAdjustment) && value.manualAdpAdjustment >= -30 && value.manualAdpAdjustment <= 30 && "isExcluded" in value && typeof value.isExcluded === "boolean";
}

function isPlayerRankingOverrides(value: unknown): value is PlayerRankingOverrides {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(isPlayerRankingOverride);
}

export function usePlayerRankingOverrides() {
  const [overrides, setOverrides] = useState<PlayerRankingOverrides>({});
  const [hasLoadedOverrides, setHasLoadedOverrides] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY);
        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);
          if (isPlayerRankingOverrides(parsedValue)) {
            setOverrides(parsedValue);
          }
        }
      } catch (error) {
        console.error("Unable to load player ranking overrides:", error);
      } finally {
        setHasLoadedOverrides(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedOverrides) {
      return;
    }
    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PLAYER_RANKING_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides, hasLoadedOverrides]);

  function updateOverride(playerKey: string, override: PlayerRankingOverride) {
    setOverrides((currentOverrides) => {
      const nextOverrides = {
        ...currentOverrides,
      };
      const isDefaultOverride = override.manualAdpAdjustment === 0 && !override.isExcluded;
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
