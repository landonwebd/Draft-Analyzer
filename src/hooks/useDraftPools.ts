"use client";

import { useEffect, useState } from "react";
import type { DraftPool } from "@/types/draft";
import { DRAFT_POOL_STORAGE_KEY } from "@/utils/draftPoolStorage";
import { createDraftPoolSlug } from "@/utils/createDraftPoolSlug";

function isDraftPool(value: unknown): value is DraftPool {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "name" in value && typeof value.name === "string" && value.name.trim() !== "";
}

function isDraftPoolArray(value: unknown): value is DraftPool[] {
  return Array.isArray(value) && value.every(isDraftPool);
}

const RESERVED_DRAFT_POOL_SLUGS = new Set(["all", "unassigned"]);

export function useDraftPools() {
  const [draftPools, setDraftPools] = useState<DraftPool[]>([]);
  const [hasLoadedDraftPools, setHasLoadedDraftPools] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(DRAFT_POOL_STORAGE_KEY);
        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);
          if (isDraftPoolArray(parsedValue)) {
            setDraftPools(parsedValue);
          }
        }
      } catch (error) {
        console.error("Unable to load draft pools:", error);
      } finally {
        setHasLoadedDraftPools(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedDraftPools) {
      return;
    }
    if (draftPools.length === 0) {
      window.localStorage.removeItem(DRAFT_POOL_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(DRAFT_POOL_STORAGE_KEY, JSON.stringify(draftPools));
  }, [draftPools, hasLoadedDraftPools]);

  function createDraftPool(name: string): boolean {
    const trimmedName = name.trim();
    if (trimmedName === "") {
      return false;
    }
    const draftPoolSlug = createDraftPoolSlug(trimmedName);
    const slugAlreadyExists = draftPools.some((draftPool) => createDraftPoolSlug(draftPool.name) === draftPoolSlug);
    if (draftPoolSlug === "" || slugAlreadyExists || RESERVED_DRAFT_POOL_SLUGS.has(draftPoolSlug)) {
      return false;
    }
    const newDraftPool: DraftPool = {
      id: crypto.randomUUID(),
      name: trimmedName,
    };
    setDraftPools((currentDraftPools) => [...currentDraftPools, newDraftPool]);
    return true;
  }

  function renameDraftPool(draftPoolId: string, nextName: string): boolean {
    const trimmedName = nextName.trim();
    if (trimmedName === "") {
      return false;
    }
    const nextSlug = createDraftPoolSlug(trimmedName);
    const slugAlreadyExists = draftPools.some((draftPool) => draftPool.id !== draftPoolId && createDraftPoolSlug(draftPool.name) === nextSlug);
    if (nextSlug === "" || RESERVED_DRAFT_POOL_SLUGS.has(nextSlug) || slugAlreadyExists) {
      return false;
    }
    setDraftPools((currentDraftPools) =>
      currentDraftPools.map((draftPool) =>
        draftPool.id === draftPoolId
          ? {
              ...draftPool,
              name: trimmedName,
            }
          : draftPool,
      ),
    );
    return true;
  }

  function deleteDraftPool(draftPoolId: string) {
    setDraftPools((currentDraftPools) => currentDraftPools.filter((draftPool) => draftPool.id !== draftPoolId));
  }
  return {
    draftPools,
    hasLoadedDraftPools,
    createDraftPool,
    renameDraftPool,
    deleteDraftPool,
  };
}
