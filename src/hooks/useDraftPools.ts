"use client";

import { useEffect, useState } from "react";
import type { DraftPool } from "@/types/draft";
import { DRAFT_POOL_STORAGE_KEY } from "@/utils/draftPoolStorage";
import { createDraftPoolSlug } from "@/utils/createDraftPoolSlug";
import { createDatabaseDraftPool, deleteDatabaseDraftPool, loadDatabaseDraftPools, renameDatabaseDraftPool } from "@/lib/supabase/draftPools";
import { hasAuthenticatedUser } from "@/lib/supabase/auth";

function isDraftPool(value: unknown): value is DraftPool {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "name" in value && typeof value.name === "string" && value.name.trim() !== "";
}

function isDraftPoolArray(value: unknown): value is DraftPool[] {
  return Array.isArray(value) && value.every(isDraftPool);
}

const RESERVED_DRAFT_POOL_SLUGS = new Set(["all", "unassigned"]);

export function useDraftPools() {
  const [draftPoolStorage, setDraftPoolStorage] = useState<"guest" | "database" | null>(null);
  const [draftPools, setDraftPools] = useState<DraftPool[]>([]);
  const [hasLoadedDraftPools, setHasLoadedDraftPools] = useState(false);

  useEffect(() => {
    let wasCancelled = false;

    async function loadDraftPools() {
      try {
        const userIsAuthenticated = await hasAuthenticatedUser();

        if (wasCancelled) {
          return;
        }

        if (userIsAuthenticated) {
          setDraftPoolStorage("database");

          const databaseDraftPools = await loadDatabaseDraftPools();

          if (!wasCancelled) {
            setDraftPools(databaseDraftPools);
          }

          return;
        }

        setDraftPoolStorage("guest");

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
        if (!wasCancelled) {
          setHasLoadedDraftPools(true);
        }
      }
    }

    void loadDraftPools();

    return () => {
      wasCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedDraftPools || draftPoolStorage !== "guest") {
      return;
    }
    if (draftPools.length === 0) {
      window.localStorage.removeItem(DRAFT_POOL_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(DRAFT_POOL_STORAGE_KEY, JSON.stringify(draftPools));
  }, [draftPools, hasLoadedDraftPools, draftPoolStorage]);

  async function createDraftPool(name: string): Promise<boolean> {
    const trimmedName = name.trim();

    if (trimmedName === "" || draftPoolStorage === null) {
      return false;
    }

    const draftPoolSlug = createDraftPoolSlug(trimmedName);
    const slugAlreadyExists = draftPools.some((draftPool) => createDraftPoolSlug(draftPool.name) === draftPoolSlug);

    if (draftPoolSlug === "" || slugAlreadyExists || RESERVED_DRAFT_POOL_SLUGS.has(draftPoolSlug)) {
      return false;
    }

    if (draftPoolStorage === "database") {
      try {
        const newDraftPool = await createDatabaseDraftPool(trimmedName, draftPoolSlug);
        setDraftPools((currentDraftPools) => [...currentDraftPools, newDraftPool]);
        return true;
      } catch (error) {
        console.error("Unable to create draft pool:", error);
        return false;
      }
    }

    const newDraftPool: DraftPool = {
      id: crypto.randomUUID(),
      name: trimmedName,
    };

    setDraftPools((currentDraftPools) => [...currentDraftPools, newDraftPool]);
    return true;
  }

  async function renameDraftPool(draftPoolId: string, nextName: string): Promise<boolean> {
    const trimmedName = nextName.trim();

    if (trimmedName === "" || draftPoolStorage === null) {
      return false;
    }

    const nextSlug = createDraftPoolSlug(trimmedName);
    const slugAlreadyExists = draftPools.some((draftPool) => draftPool.id !== draftPoolId && createDraftPoolSlug(draftPool.name) === nextSlug);

    if (nextSlug === "" || RESERVED_DRAFT_POOL_SLUGS.has(nextSlug) || slugAlreadyExists) {
      return false;
    }

    if (draftPoolStorage === "database") {
      try {
        const renamedDraftPool = await renameDatabaseDraftPool(draftPoolId, trimmedName, nextSlug);

        setDraftPools((currentDraftPools) => currentDraftPools.map((draftPool) => (draftPool.id === draftPoolId ? renamedDraftPool : draftPool)));

        return true;
      } catch (error) {
        console.error("Unable to rename draft pool:", error);
        return false;
      }
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

  async function deleteDraftPool(draftPoolId: string): Promise<boolean> {
    if (draftPoolStorage === null) {
      return false;
    }

    if (draftPoolStorage === "database") {
      try {
        await deleteDatabaseDraftPool(draftPoolId);
      } catch (error) {
        console.error("Unable to delete draft pool:", error);
        return false;
      }
    }

    setDraftPools((currentDraftPools) => currentDraftPools.filter((draftPool) => draftPool.id !== draftPoolId));
    return true;
  }

  function addMergedDraftPools(createdDraftPools: DraftPool[]): void {
    if (draftPoolStorage !== "database") {
      return;
    }
    setDraftPools((currentDraftPools) => {
      const currentDraftPoolIds = new Set(currentDraftPools.map((draftPool) => draftPool.id));
      const newDraftPools = createdDraftPools.filter((draftPool) => !currentDraftPoolIds.has(draftPool.id));
      return [...currentDraftPools, ...newDraftPools];
    });
  }

  return {
    draftPools,
    draftPoolStorage,
    hasLoadedDraftPools,
    createDraftPool,
    renameDraftPool,
    deleteDraftPool,
    addMergedDraftPools,
  };
}
