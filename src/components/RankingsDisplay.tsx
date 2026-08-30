"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import type { PlayerRanking, PositionFilter, RankingSortField, SortDirection, DraftTrackerState, DraftTrackerStatus, DraftTrackerSession } from "@/types/draft";
import FilterSelect from "@/components/FilterSelect";
import SortableHeader from "@/components/SortableHeader";
import { DRAFT_TRACKER_STORAGE_KEY } from "@/utils/draftStorage";
import { buildPlayerRankings } from "@/utils/buildPlayerRankings";
import { positionOptions } from "@/utils/positionOptions";
import { createRankingsCsv } from "@/utils/createRankingsCsv";
import { createPlayerKey } from "@/utils/createPlayerKey";
import { addRankingTiers } from "@/utils/addRankingTiers";
import { createPlayerSlug } from "@/utils/createPlayerSlug";
import { createDraftPoolSlug } from "@/utils/createDraftPoolSlug";
import { usePlayerRankingOverrides } from "@/hooks/usePlayerRankingOverrides";
import { useDraftPools } from "@/hooks/useDraftPools";
import { useImportedDrafts } from "@/hooks/useImportedDrafts";
import Link from "next/link";
import { Download, Bomb, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { RANKINGS_POOL_STORAGE_KEY } from "@/utils/draftPoolStorage";
import { getPositionColor } from "@/utils/positionStyles";

type RankingsDisplayProps = {
  initialPoolSlug: string | null;
};

export default function RankingsDisplay({ initialPoolSlug }: RankingsDisplayProps) {
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>("ALL");
  const [sortField, setSortField] = useState<RankingSortField>("finalPersonalizedAdp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ascending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDraftTrackerModeActive, setIsDraftTrackerModeActive] = useState(false);
  const [draftTrackerState, setDraftTrackerState] = useState<DraftTrackerState>({});
  const [showDraftTrackerExitConfirmation, setShowDraftTrackerExitConfirmation] = useState(false);
  const [hasLoadedDraftTrackerSession, setHasLoadedDraftTrackerSession] = useState(false);
  const [activeRankingView, setActiveRankingView] = useState<"rankings" | "excluded">("rankings");
  const router = useRouter();
  const selectedDraftPoolSlug = initialPoolSlug ?? "all";
  const { overrides, hasLoadedOverrides } = usePlayerRankingOverrides();
  const { draftPools, hasLoadedDraftPools } = useDraftPools();
  const { importedDrafts: drafts, hasLoadedImportedDrafts: hasLoaded } = useImportedDrafts();
  const selectedDraftPool = draftPools.find((draftPool) => createDraftPoolSlug(draftPool.name) === selectedDraftPoolSlug);
  const hasUnassignedDrafts = drafts.some((draft) => !draft.poolId);
  const activePoolSlug = selectedDraftPoolSlug === "all" || (selectedDraftPoolSlug === "unassigned" && hasUnassignedDrafts) || selectedDraftPool ? selectedDraftPoolSlug : "all";
  const poolFilteredDrafts = useMemo(() => {
    if (activePoolSlug === "all") {
      return drafts;
    }
    if (activePoolSlug === "unassigned") {
      return drafts.filter((draft) => draft.poolId === undefined);
    }
    return drafts.filter((draft) => draft.poolId === selectedDraftPool?.id);
  }, [drafts, activePoolSlug, selectedDraftPool]);
  const rankings = useMemo(() => buildPlayerRankings(poolFilteredDrafts, overrides), [poolFilteredDrafts, overrides]);
  const visibleRankings = rankings.filter((player) => !player.isExcluded);
  const excludedRankings = rankings.filter((player) => player.isExcluded);
  const hasDraftTrackerProgress = Object.keys(draftTrackerState).length > 0;
  const positionFilteredRankings = selectedPosition === "ALL" ? visibleRankings : visibleRankings.filter((player) => player.position === selectedPosition);
  const rankingsWithTiers = addRankingTiers(positionFilteredRankings);
  const filteredRankings = rankingsWithTiers.filter((player) => player.playerName.toLowerCase().includes(searchTerm.toLowerCase()));
  const filtersAreClear = selectedPosition === "ALL" && searchTerm === "";
  const sortedRankings = [...filteredRankings].sort((firstPlayer, secondPlayer) => {
    const firstValue = firstPlayer[sortField];
    const secondValue = secondPlayer[sortField];
    if (firstValue === null && secondValue === null) {
      return 0;
    }
    if (firstValue === null) {
      return 1;
    }
    if (secondValue === null) {
      return -1;
    }
    const difference = firstValue - secondValue;
    return sortDirection === "ascending" ? difference : -difference;
  });
  const draftTrackerCounts = visibleRankings.reduce(
    (counts, player) => {
      const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);
      const status = draftTrackerState[playerKey] ?? "available";
      counts[status] += 1;
      return counts;
    },
    {
      available: 0,
      mine: 0,
      taken: 0,
    } satisfies Record<DraftTrackerStatus, number>,
  );
  const tierRowsAreVisible = sortField === "finalPersonalizedAdp" && sortDirection === "ascending";
  const draftPoolOptions = [
    {
      value: "all",
      label: `All Drafts (${drafts.length})`,
    },
    ...(hasUnassignedDrafts
      ? [
          {
            value: "unassigned",
            label: `Unassigned (${drafts.filter((draft) => !draft.poolId).length})`,
          },
        ]
      : []),
    ...draftPools.map((draftPool) => ({
      value: createDraftPoolSlug(draftPool.name),
      label: `${draftPool.name} (${drafts.filter((draft) => draft.poolId === draftPool.id).length})`,
    })),
  ];
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedValue = window.sessionStorage.getItem(DRAFT_TRACKER_STORAGE_KEY);

        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);

          if (typeof parsedValue === "object" && parsedValue !== null && "isActive" in parsedValue && "playerStatuses" in parsedValue) {
            const storedSession = parsedValue as DraftTrackerSession;

            if (typeof storedSession.isActive === "boolean" && typeof storedSession.playerStatuses === "object" && storedSession.playerStatuses !== null && !Array.isArray(storedSession.playerStatuses)) {
              setIsDraftTrackerModeActive(storedSession.isActive);
              setDraftTrackerState(storedSession.playerStatuses);
            }
          }
        }
      } catch (error) {
        console.error("Unable to load the Draft Tracker session:", error);
      } finally {
        setHasLoadedDraftTrackerSession(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedDraftPools || !hasLoaded) {
      return;
    }

    if (initialPoolSlug === "unassigned" && !hasUnassignedDrafts) {
      window.localStorage.removeItem(RANKINGS_POOL_STORAGE_KEY);
      router.replace("/rankings", { scroll: false });
      return;
    }

    if (initialPoolSlug !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const storedPoolSlug = window.localStorage.getItem(RANKINGS_POOL_STORAGE_KEY);

      if (!storedPoolSlug || storedPoolSlug === "all") {
        return;
      }

      const storedPoolExists = storedPoolSlug === "unassigned" ? hasUnassignedDrafts : draftPools.some((draftPool) => createDraftPoolSlug(draftPool.name) === storedPoolSlug);

      if (!storedPoolExists) {
        window.localStorage.removeItem(RANKINGS_POOL_STORAGE_KEY);
        return;
      }

      router.replace(`/rankings?pool=${encodeURIComponent(storedPoolSlug)}`, {
        scroll: false,
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftPools, hasLoaded, hasLoadedDraftPools, hasUnassignedDrafts, initialPoolSlug, router]);

  useEffect(() => {
    if (!hasLoadedDraftTrackerSession) {
      return;
    }

    const sessionToSave: DraftTrackerSession = {
      isActive: isDraftTrackerModeActive,
      playerStatuses: draftTrackerState,
    };

    window.sessionStorage.setItem(DRAFT_TRACKER_STORAGE_KEY, JSON.stringify(sessionToSave));
  }, [draftTrackerState, hasLoadedDraftTrackerSession, isDraftTrackerModeActive]);
  function handleSelectedPosition(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedPosition(event.target.value as PositionFilter);
  }

  function handleSort(nextSortField: RankingSortField) {
    if (nextSortField === sortField) {
      setSortDirection((currentDirection) => (currentDirection === "ascending" ? "descending" : "ascending"));
      return;
    }

    setSortField(nextSortField);
    setSortDirection("ascending");
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  function handleClearFilter() {
    if (filtersAreClear) {
      return;
    }
    setSelectedPosition("ALL");
    setSearchTerm("");
  }

  if (!hasLoaded || !hasLoadedOverrides || !hasLoadedDraftPools) {
    return <p className="mt-8 text-slate-300">Building rankings...</p>;
  }

  if (drafts.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-bold">No rankings yet</h2>
        <p className="mt-2 text-slate-400">Import and save at least one draft to build your player rankings.</p>
      </div>
    );
  }

  function handleExportRankings() {
    if (sortedRankings.length === 0) {
      return;
    }

    const csvContent = createRankingsCsv(sortedRankings);

    const csvBlob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl = window.URL.createObjectURL(csvBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "draft-rankings.csv";
    downloadLink.click();

    window.URL.revokeObjectURL(downloadUrl);
  }

  function handleDraftTrackerModeChange() {
    if (!isDraftTrackerModeActive) {
      setIsDraftTrackerModeActive(true);
      return;
    }

    if (!hasDraftTrackerProgress) {
      setIsDraftTrackerModeActive(false);
      return;
    }

    setShowDraftTrackerExitConfirmation(true);
  }

  function handleDraftTrackerStatusChange(player: PlayerRanking, nextStatus: DraftTrackerStatus) {
    const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);

    setDraftTrackerState((currentState) => {
      if (nextStatus === "available") {
        const nextState = { ...currentState };
        delete nextState[playerKey];
        return nextState;
      }

      return {
        ...currentState,
        [playerKey]: nextStatus,
      };
    });
  }

  function handleConfirmDraftTrackerExit() {
    setDraftTrackerState({});
    setIsDraftTrackerModeActive(false);
    setShowDraftTrackerExitConfirmation(false);
  }

  function handleCycleDraftTrackerStatus(player: PlayerRanking, currentStatus: DraftTrackerStatus) {
    let nextStatus: DraftTrackerStatus;

    switch (currentStatus) {
      case "available":
        nextStatus = "taken";
        break;
      case "taken":
        nextStatus = "mine";
        break;
      case "mine":
        nextStatus = "available";
        break;
    }

    handleDraftTrackerStatusChange(player, nextStatus);
  }

  function handleDraftPoolChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextPoolSlug = event.target.value;
    const nextUrl = nextPoolSlug === "all" ? "/rankings" : `/rankings?pool=${encodeURIComponent(nextPoolSlug)}`;
    window.localStorage.setItem(RANKINGS_POOL_STORAGE_KEY, nextPoolSlug);
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Player ranking views" className="mb-2 flex border-b border-slate-800">
        <button id="rankings-tab" aria-controls="rankings-panel" type="button" role="tab" aria-selected={activeRankingView === "rankings"} onClick={() => setActiveRankingView("rankings")} className={`cursor-pointer border-b-2 px-5 py-3 font-semibold transition-colors ${activeRankingView === "rankings" ? "border-sky-400 text-sky-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          Rankings ({visibleRankings.length})
        </button>
        <button id="excluded-tab" aria-controls="excluded-panel" type="button" role="tab" aria-selected={activeRankingView === "excluded"} onClick={() => setActiveRankingView("excluded")} className={`cursor-pointer border-b-2 px-5 py-3 font-semibold transition-colors ${activeRankingView === "excluded" ? "border-red-400 text-red-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          Excluded ({excludedRankings.length})
        </button>
      </div>
      <div role="tabpanel" id="rankings-panel" aria-labelledby="rankings-tab" hidden={activeRankingView !== "rankings"}>
        <div className="bg-slate-950 xl:sticky xl:top-0 xl:z-40 xl:py-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(5,auto)]">
            <FilterSelect id="rankingDraftPoolFilter" label="Choose a draft pool" value={activePoolSlug} options={draftPoolOptions} onChange={handleDraftPoolChange} />
            <FilterSelect id="rankingPositionFilter" label="Filter rankings by position" value={selectedPosition} options={positionOptions} onChange={handleSelectedPosition} />
            <input type="search" autoComplete="off" value={searchTerm} onChange={handleSearchChange} placeholder="Search players..." className="w-full rounded-lg border border-slate-500 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500" />
            <button type="button" onClick={handleClearFilter} aria-disabled={filtersAreClear} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${filtersAreClear ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
              Clear Filters
            </button>
            <button type="button" onClick={handleExportRankings} aria-label="Export rankings as CSV" title="Export rankings as CSV" aria-disabled={sortedRankings.length === 0} className="w-fit rounded-lg border border-slate-700 px-4 py-3 text-slate-300 cursor-pointer hover:bg-slate-800">
              <Download />
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-900 p-4">
            <span id="draft-tracker-label" className="font-semibold text-slate-200">
              Draft Tracker Mode
            </span>
            <button type="button" role="switch" aria-checked={isDraftTrackerModeActive} aria-labelledby="draft-tracker-label" onClick={handleDraftTrackerModeChange} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none ${isDraftTrackerModeActive ? "border-emerald-500 bg-emerald-600" : "border-slate-600 bg-slate-700"}`}>
              <span aria-hidden="true" className={`size-5 rounded-full bg-white shadow-md transition-transform duration-200 ${isDraftTrackerModeActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-400">{isDraftTrackerModeActive ? "On" : "Off"}</span>
            {isDraftTrackerModeActive && (
              <dl className="flex flex-wrap gap-2 sm:ml-auto">
                <div className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-300">
                  <dt>Available</dt>
                  <dd className="font-bold tabular-nums">{draftTrackerCounts.available}</dd>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-amber-600 bg-amber-950 px-3 py-1 text-sm text-amber-300">
                  <dt>Unavailable</dt>
                  <dd className="font-bold tabular-nums">{draftTrackerCounts.taken}</dd>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-sky-500 bg-sky-950 px-3 py-1 text-sm text-sky-300">
                  <dt>Mine</dt>
                  <dd className="font-bold tabular-nums">{draftTrackerCounts.mine}</dd>
                </div>
              </dl>
            )}
          </div>
          <p className="text-sm mt-2 text-slate-300">
            A <span className="font-semibold">meaningful pass</span> occurs when a player was available near one of your picks, but you selected someone with a later overall average draft position.
          </p>
          <p className="mt-2 text-sm text-slate-300">
            <span className="font-semibold">Tiers:</span> <span className="text-sky-300">Meaningful</span> gaps between players create a new tier. Tiers only display when sorting by Personalized ADP.
          </p>
        </div>
        {showDraftTrackerExitConfirmation && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="draft-tracker-exit-dialog-title" className="w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-red-950/50">
              <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-700 bg-red-950 text-red-300">
                <Bomb className="size-7" aria-hidden="true" />
              </div>
              <h3 id="draft-tracker-exit-dialog-title" className="mt-4 text-center text-2xl font-bold">
                Turn Off Draft Tracker Mode?
              </h3>
              <p className="mt-3 text-center text-slate-300">
                This will clear every <span className="text-sky-300">Mine</span> and <span className="text-amber-300">Unavailable</span> selection from your current tracker session.
              </p>
              <p className="mt-3 text-center text-sm text-slate-400">Your imported drafts and Personalized ADP will not be affected.</p>
              <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-red-400">This action cannot be undone.</p>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => setShowDraftTrackerExitConfirmation(false)} className="cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800">
                  Never mind
                </button>
                <button type="button" onClick={handleConfirmDraftTrackerExit} className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-500">
                  Turn off Draft Tracker Mode
                </button>
              </div>
            </div>
          </div>
        )}
        {poolFilteredDrafts.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">No drafts in this pool</h2>
            <p className="mt-2 text-slate-400">Assign at least one imported draft to this pool to build its personalized rankings.</p>
          </div>
        )}
        <div className="overflow-x-auto xl:overflow-x-visible">
          <table className="w-full min-w-[1050px] table-fixed text-left">
            <colgroup>
              {isDraftTrackerModeActive && <col className="w-36" />}
              <col className="w-36" />
              <col className="w-56" />
              <col className="w-24" />
              <col className="w-16" />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-36" />
            </colgroup>
            <thead className="text-sm text-slate-400 xl:sticky xl:top-[210px] xl:z-30 xl:bg-slate-700 xl:shadow-md">
              <tr>
                {isDraftTrackerModeActive && <th className="w-36 px-3 py-2 text-left">Draft Status</th>}
                <SortableHeader label="Personalized ADP" field="finalPersonalizedAdp" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="w-64 px-3 py-2">
                  Player <span className="text-xs font-normal">(meaningful pass)</span>
                </th>
                <th className="px-3 py-2">Position</th>
                <SortableHeader label="Bye" field="byeWeek" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
                <SortableHeader label="My Drafts" field="myDraftCount" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
                <SortableHeader label="My Avg. Pick" field="myAverageOverallPick" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
                <SortableHeader label="Overall Avg." field="averageOverallPick" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
                <SortableHeader label="% Drafted" field="draftRate" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {sortedRankings.map((player, index) => {
                const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);
                const playerSlug = createPlayerSlug(playerKey);
                const trackerStatus = draftTrackerState[playerKey] ?? "available";
                const trackerStatusLabel = trackerStatus === "available" ? "Available" : trackerStatus === "taken" ? "Unavailable" : "Mine";
                const trackerStatusClasses = trackerStatus === "available" ? "border-slate-600 bg-slate-800 text-slate-300" : trackerStatus === "taken" ? "border-amber-300 bg-amber-400 text-slate-950" : "border-sky-300 bg-sky-400 text-slate-950";
                const trackerRowClasses = !isDraftTrackerModeActive ? "" : trackerStatus === "taken" ? "bg-amber-950/60 [&>td:not(:first-child)]:line-through [&>td:not(:first-child)]:decoration-1 [&>td:not(:first-child)]:decoration-amber-400" : trackerStatus === "mine" ? "bg-sky-900/70" : "";
                const startsNewTier = tierRowsAreVisible && (index === 0 || sortedRankings[index - 1].tier !== player.tier);
                return (
                  <Fragment key={playerKey}>
                    {startsNewTier && (
                      <tr>
                        <td colSpan={isDraftTrackerModeActive ? 9 : 8} className="bg-slate-800 px-3 py-1 text-sm font-bold uppercase tracking-wide text-sky-300">
                          Tier {player.tier}
                        </td>
                      </tr>
                    )}
                    <tr className={trackerRowClasses}>
                      {isDraftTrackerModeActive && (
                        <td className="px-3 py-1">
                          <button type="button" onClick={() => handleCycleDraftTrackerStatus(player, trackerStatus)} aria-label={`${player.playerName}: ${trackerStatusLabel}. Click to change status.`} className={`inline-flex min-w-28 cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${trackerStatusClasses}`}>
                            <span aria-hidden="true" className="size-2 rounded-full bg-current" />
                            {trackerStatusLabel}
                          </button>
                        </td>
                      )}
                      <td className="px-3 py-1 text-left tabular-nums">
                        <div className="flex items-center gap-2">
                          <span>{player.finalPersonalizedAdp.toFixed(2)}</span>
                          {player.manualAdpAdjustment !== 0 && (
                            <span aria-label={`Manually adjusted by ${player.manualAdpAdjustment > 0 ? "+" : ""}${player.manualAdpAdjustment} picks`} title={`Manual adjustment: ${player.manualAdpAdjustment > 0 ? "+" : ""}${player.manualAdpAdjustment} picks`} className="grid size-5 place-items-center rounded-full bg-sky-500/10 text-sky-300">
                              <SlidersHorizontal size={12} aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1">
                        <div className="flex min-w-0 items-baseline gap-2">
                          <Link
                            href={{
                              pathname: `/players/${playerSlug}`,
                              query: {
                                pool: activePoolSlug,
                              },
                            }}
                            className="min-w-0 truncate text-sky-300 hover:text-sky-200 hover:underline"
                            title={`View ${player.playerName}`}
                          >
                            {player.playerName}
                          </Link>
                          {player.meaningfulPassCount > 0 && <span className="shrink-0 text-xs font-normal text-slate-500">({player.meaningfulPassCount})</span>}
                        </div>
                      </td>
                      <td className="px-3 py-1 tabular-nums" title={`${player.position} rank ${player.positionRank}`}>
                        <div className={`w-fit py-0.5 px-2 rounded-full ${getPositionColor(player.position)}`}>
                          {player.position}
                          {player.positionRank}
                        </div>
                      </td>
                      <td className="px-3 py-1 text-right tabular-nums">{player.byeWeek !== null ? player.byeWeek : "—"}</td>
                      <td className="px-3 py-1 text-right tabular-nums">{player.myDraftCount}</td>
                      <td className="px-3 py-1 text-right tabular-nums">{player.myAverageOverallPick === null ? "—" : player.myAverageOverallPick.toFixed(1)}</td>
                      <td className="px-3 py-1 text-right tabular-nums">{player.averageOverallPick.toFixed(1)}</td>
                      <td className="px-3 py-1 text-right tabular-nums">
                        {(player.draftRate * 100).toFixed(0)}%
                        <span className="ml-2 text-xs text-slate-500">
                          ({player.timesDrafted}/{player.totalDrafts})
                        </span>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div role="tabpanel" id="excluded-panel" aria-labelledby="excluded-tab" hidden={activeRankingView !== "excluded"}>
        <section className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
          <h2 className="text-xl font-bold text-red-200">Excluded Players ({excludedRankings.length})</h2>

          <p className="mt-2 text-sm text-slate-400">Select a player to review or remove their ranking exclusion.</p>

          {excludedRankings.length === 0 ? (
            <p className="mt-6 text-slate-400">You haven&apos;t excluded any players.</p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {excludedRankings.map((player) => {
                const excludedPlayerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);

                const excludedPlayerSlug = createPlayerSlug(excludedPlayerKey);

                return (
                  <Link
                    key={excludedPlayerKey}
                    href={{
                      pathname: `/players/${excludedPlayerSlug}`,
                      query: {
                        pool: activePoolSlug,
                      },
                    }}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 hover:border-red-800 hover:bg-red-950/30"
                  >
                    <span className="block font-semibold text-slate-200">{player.playerName}</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {player.position} · {player.nflTeam}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
