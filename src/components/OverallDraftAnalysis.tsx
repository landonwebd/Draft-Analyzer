"use client";

import { useEffect, useState } from "react";
import FilterSelect from "@/components/FilterSelect";
import PositionBySlotAndRoundChart from "@/components/PositionBySlotAndRoundChart";
import { useImportedDrafts } from "@/hooks/useImportedDrafts";
import { useDraftPools } from "@/hooks/useDraftPools";
import { buildDraftSlotCounts } from "@/utils/buildDraftSlotCounts";
import { buildPositionBySlotAndRound } from "@/utils/buildPositionBySlotAndRound";
import { ANALYSIS_POOL_STORAGE_KEY } from "@/utils/draftPoolStorage";
import { getDraftLeagueSize } from "@/utils/getDraftLeagueSize";

export default function OverallDraftAnalysis() {
  const { importedDrafts, hasLoadedImportedDrafts } = useImportedDrafts();
  const { draftPools, hasLoadedDraftPools } = useDraftPools();
  const [selectedDraftPoolId, setSelectedDraftPoolId] = useState("all");
  const [selectedLeagueSize, setSelectedLeagueSize] = useState("all");
  const [hasLoadedSelectedDraftPool, setHasLoadedSelectedDraftPool] = useState(false);
  const hasUnassignedDrafts = importedDrafts.some((draft) => !draft.poolId);
  const draftPoolOptions = [
    {
      value: "all",
      label: `All Drafts (${importedDrafts.length})`,
    },
    ...(hasUnassignedDrafts
      ? [
          {
            value: "unassigned",
            label: `Unassigned (${importedDrafts.filter((draft) => !draft.poolId).length})`,
          },
        ]
      : []),
    ...draftPools.map((draftPool) => ({
      value: draftPool.id,
      label: `${draftPool.name} (${importedDrafts.filter((draft) => draft.poolId === draftPool.id).length})`,
    })),
  ];

  useEffect(() => {
    if (!hasLoadedImportedDrafts || !hasLoadedDraftPools) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      const storedDraftPoolId = window.localStorage.getItem(ANALYSIS_POOL_STORAGE_KEY);
      const storedDraftPoolExists = storedDraftPoolId === "all" || (storedDraftPoolId === "unassigned" && hasUnassignedDrafts) || draftPools.some((draftPool) => draftPool.id === storedDraftPoolId);
      if (storedDraftPoolId && storedDraftPoolExists) {
        setSelectedDraftPoolId(storedDraftPoolId);
      } else if (storedDraftPoolId) {
        window.localStorage.removeItem(ANALYSIS_POOL_STORAGE_KEY);
      }
      setHasLoadedSelectedDraftPool(true);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftPools, hasLoadedDraftPools, hasLoadedImportedDrafts, hasUnassignedDrafts]);

  let poolFilteredDrafts = importedDrafts;

  if (selectedDraftPoolId === "unassigned") {
    poolFilteredDrafts = importedDrafts.filter((draft) => !draft.poolId);
  } else if (selectedDraftPoolId !== "all") {
    poolFilteredDrafts = importedDrafts.filter((draft) => draft.poolId === selectedDraftPoolId);
  }

  const recognizedLeagueSizes = Array.from(new Set(poolFilteredDrafts.map(getDraftLeagueSize).filter((leagueSize) => leagueSize > 0))).sort((firstSize, secondSize) => firstSize - secondSize);

  const leagueSizeOptions = [
    {
      value: "all",
      label: `All League Sizes (${poolFilteredDrafts.length})`,
    },
    ...recognizedLeagueSizes.map((leagueSize) => {
      const draftCount = poolFilteredDrafts.filter((draft) => getDraftLeagueSize(draft) === leagueSize).length;

      return {
        value: String(leagueSize),
        label: `${leagueSize}-Team Leagues (${draftCount})`,
      };
    }),
  ];

  const filteredDrafts = selectedLeagueSize === "all" ? poolFilteredDrafts : poolFilteredDrafts.filter((draft) => getDraftLeagueSize(draft) === Number(selectedLeagueSize));

  if (!hasLoadedImportedDrafts || !hasLoadedDraftPools || !hasLoadedSelectedDraftPool) {
    return <p className="mt-8 text-slate-400">Loading draft analysis…</p>;
  }
  const draftSlotCounts = buildDraftSlotCounts(filteredDrafts);
  const largestDraftSlotCount = Math.max(...draftSlotCounts.map((slotCount) => slotCount.draftCount), 0);
  const positionBySlotAndRound = buildPositionBySlotAndRound(filteredDrafts);

  if (importedDrafts.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-bold">No drafts to analyze yet</h2>
        <p className="mt-2 text-slate-400">Import at least one draft to begin exploring your drafting tendencies.</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">Draft history loaded</p>
      <p className="mt-2 text-3xl font-bold">
        Analyzing {filteredDrafts.length} {filteredDrafts.length === 1 ? "draft" : "drafts"}
      </p>
      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Draft Pool</p>
          <FilterSelect
            id="analysisDraftPool"
            label="Choose a draft pool to analyze"
            value={selectedDraftPoolId}
            options={draftPoolOptions}
            onChange={(event) => {
              const nextDraftPoolId = event.target.value;
              setSelectedDraftPoolId(nextDraftPoolId);
              setSelectedLeagueSize("all");
              window.localStorage.setItem(ANALYSIS_POOL_STORAGE_KEY, nextDraftPoolId);
            }}
          />
        </div>
        {recognizedLeagueSizes.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">League Size</p>
            <FilterSelect
              id="analysisLeagueSize"
              label="Choose a league size to analyze"
              value={selectedLeagueSize}
              options={leagueSizeOptions}
              onChange={(event) => {
                setSelectedLeagueSize(event.target.value);
              }}
            />
          </div>
        )}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold">Draft Slot History</h2>
        <p className="mt-2 text-slate-400">How often you have drafted from each starting position.</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {draftSlotCounts.map(({ slot, draftCount }) => {
            const draftPercentage = filteredDrafts.length === 0 ? 0 : (draftCount / filteredDrafts.length) * 100;
            const barWidthPercentage = largestDraftSlotCount === 0 ? 0 : (draftCount / largestDraftSlotCount) * 100;
            return (
              <div key={slot} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center">
                <dt className="text-sm font-semibold text-slate-400">Slot {slot}</dt>
                <dd className="mt-2 text-2xl font-bold text-white">{draftCount}</dd>
                <dd className="mt-1 text-xs text-slate-500">{draftPercentage.toFixed(1)}% of drafts</dd>
                <dd className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${barWidthPercentage}%` }} />
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <PositionBySlotAndRoundChart slotBreakdowns={positionBySlotAndRound} />
    </section>
  );
}
