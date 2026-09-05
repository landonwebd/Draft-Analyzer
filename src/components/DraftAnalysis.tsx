"use client";

import { useMemo, useState } from "react";
import type { PositionFilter } from "@/types/draft";
import { useImportedDrafts } from "@/hooks/useImportedDrafts";
import FilterSelect from "@/components/FilterSelect";
import PlayerList from "@/components/PlayerList";
import StatCard from "@/components/StatCard";
import PositionBreakdown from "@/components/PositionBreakdown";
import { convertDraftPicksToPlayers } from "@/utils/draftTransforms";
import { positionOptions } from "@/utils/positionOptions";
import { buildPlayerRankings } from "@/utils/buildPlayerRankings";
import { getBestAvailablePlayers } from "@/utils/getBestAvailablePlayers";
import { createDraftPoolSlug } from "@/utils/createDraftPoolSlug";
import { usePlayerRankingOverrides } from "@/hooks/usePlayerRankingOverrides";
import BestAvailableDisplay from "@/components/BestAvailableDisplay";
import DraftSettingsControl from "@/components/DraftSettingsControl";
import { useDraftPools } from "@/hooks/useDraftPools";
import { useRouter } from "next/navigation";

type DraftAnalysisProps = {
  draftId: string;
};

export default function DraftAnalysis({ draftId }: DraftAnalysisProps) {
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>("ALL");
  const [selectedFantasyTeamFilter, setSelectedFantasyTeamFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDraftView, setActiveDraftView] = useState<"results" | "bestAvailable">("results");
  const [selectedBestAvailablePosition, setSelectedBestAvailablePosition] = useState<PositionFilter>("ALL");
  const [bestAvailableSearchTerm, setBestAvailableSearchTerm] = useState("");
  const router = useRouter();
  const { draftPools, hasLoadedDraftPools } = useDraftPools();
  const { overrides, hasLoadedOverrides } = usePlayerRankingOverrides();
  const { importedDrafts: drafts, hasLoadedImportedDrafts: hasLoaded, assignImportedDraftToPool, renameImportedDraft } = useImportedDrafts();
  const draftPoolOptions = [
    {
      value: "",
      label: "Unassigned",
    },
    ...draftPools.map((pool) => ({
      value: pool.id,
      label: pool.name,
    })),
  ];
  const draftOptions = [...drafts]
    .sort((firstDraft, secondDraft) => firstDraft.name.localeCompare(secondDraft.name))
    .map((storedDraft) => ({
      value: storedDraft.id,
      label: storedDraft.name,
    }));
  const filtersAreClear = selectedPosition === "ALL" && searchTerm === "" && selectedFantasyTeamFilter === "ALL";
  const bestAvailableFiltersAreClear = selectedBestAvailablePosition === "ALL" && bestAvailableSearchTerm === "";
  const draft = drafts.find((storedDraft) => storedDraft.id === draftId) ?? null;
  const draftPoolDrafts = useMemo(() => (draft ? drafts.filter((storedDraft) => (draft.poolId ? storedDraft.poolId === draft.poolId : storedDraft.poolId === undefined)) : []), [drafts, draft]);
  const rankings = useMemo(() => buildPlayerRankings(draftPoolDrafts, overrides), [draftPoolDrafts, overrides]);
  const bestAvailablePlayers = useMemo(() => (draft ? getBestAvailablePlayers(rankings, draft.picks) : []), [rankings, draft]);
  const filteredBestAvailablePlayers = bestAvailablePlayers.filter((player) => {
    const matchesPosition = selectedBestAvailablePosition === "ALL" || player.position === selectedBestAvailablePosition;
    const matchesSearch = player.playerName.toLowerCase().includes(bestAvailableSearchTerm.toLowerCase());
    return matchesPosition && matchesSearch;
  });
  function handleSelectedPosition(value: string) {
    setSelectedPosition(value as PositionFilter);
  }

  function handleSelectedFantasyTeam(value: string) {
    setSelectedFantasyTeamFilter(value);
  }

  function handleBestAvailablePosition(value: string) {
    setSelectedBestAvailablePosition(value as PositionFilter);
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
    setSelectedFantasyTeamFilter("ALL");
  }
  function handleBestAvailableClearFilter() {
    if (bestAvailableFiltersAreClear) {
      return;
    }
    setSelectedBestAvailablePosition("ALL");
    setBestAvailableSearchTerm("");
  }

  async function handleDraftPoolChange(value: string) {
    const selectedPoolId = value === "" ? undefined : value;
    await assignImportedDraftToPool(draftId, selectedPoolId);
  }

  function handleDraftChange(nextDraftId: string) {
    router.push(`/drafts/${encodeURIComponent(nextDraftId)}`);
  }

  if (!hasLoaded || !hasLoadedOverrides || !hasLoadedDraftPools) {
    return <p className="mt-4 text-slate-300">Loading draft...</p>;
  }

  if (!draft) {
    return <p className="mt-4 text-red-300">Draft not found.</p>;
  }

  let draftPoolSlug = "unassigned";
  if (draft.poolId) {
    const assignedDraftPool = draftPools.find((draftPool) => draftPool.id === draft.poolId);
    if (assignedDraftPool) {
      draftPoolSlug = createDraftPoolSlug(assignedDraftPool.name);
    }
  }
  const fantasyTeams = [...new Set(draft.picks.map((pick) => pick.fantasyTeam))];
  const fantasyTeamOptions = [
    { value: "ALL", label: "Show all fantasy teams" },
    ...fantasyTeams.map((fantasyTeam) => ({
      value: fantasyTeam,
      label: fantasyTeam,
    })),
  ];
  const filteredPicks = draft.picks.filter((pick) => {
    const matchesPosition = selectedPosition === "ALL" || pick.position === selectedPosition;
    const matchesTeam = selectedFantasyTeamFilter === "ALL" || pick.fantasyTeam === selectedFantasyTeamFilter;
    const matchesSearch = pick.playerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPosition && matchesTeam && matchesSearch;
  });
  const filteredPlayers = convertDraftPicksToPlayers(filteredPicks);
  const myRosterSize = draft.picks.filter((pick) => pick.fantasyTeam === draft.myFantasyTeam).length;
  const breakdownPicks = selectedFantasyTeamFilter === "ALL" ? draft.picks : draft.picks.filter((pick) => pick.fantasyTeam === selectedFantasyTeamFilter);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">{draft.name}</h1>
        <DraftSettingsControl draftName={draft.name} onRename={(nextName) => renameImportedDraft(draft.id, nextName)} />
      </div>
      <p className="mt-3 text-slate-300">
        Your fantasy team: <span className="font-bold text-white">{draft.myFantasyTeam}</span>
      </p>
      <p className="mt-1 text-slate-400">{draft.picks.length} total draft picks</p>
      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">League</p>
          <FilterSelect id="draftSwitcher" label="Switch to another league" value={draft.id} options={draftOptions} onValueChange={handleDraftChange} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Draft Pool</p>
          <FilterSelect id={`draftPool-${draft.id}`} label={`Change the draft pool for ${draft.name}`} value={draft.poolId ?? ""} options={draftPoolOptions} onValueChange={handleDraftPoolChange} />
        </div>
      </div>
      <div role="tablist" aria-label="Draft analysis views" className="mt-8 flex border-b border-slate-800">
        <button type="button" role="tab" id="draft-results-tab" aria-selected={activeDraftView === "results"} aria-controls="draft-results-panel" onClick={() => setActiveDraftView("results")} className={`cursor-pointer border-b-2 px-5 py-3 font-semibold transition-colors ${activeDraftView === "results" ? "border-sky-400 text-sky-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          Draft Results
        </button>
        <button type="button" role="tab" id="best-available-tab" aria-selected={activeDraftView === "bestAvailable"} aria-controls="best-available-panel" onClick={() => setActiveDraftView("bestAvailable")} className={`cursor-pointer border-b-2 px-5 py-3 font-semibold transition-colors ${activeDraftView === "bestAvailable" ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          Best Available ({bestAvailablePlayers.length})
        </button>
      </div>
      <div role="tabpanel" id="draft-results-panel" aria-labelledby="draft-results-tab" hidden={activeDraftView !== "results"}>
        <div className="mt-8 grid md:grid-cols-3 xl:grid-cols-4 gap-4">
          <FilterSelect id="positionFilter" label="Filter by position" value={selectedPosition} options={positionOptions} onValueChange={handleSelectedPosition} />
          <FilterSelect id="fantasyTeamFilter" label="Filter by Fantasy Team" value={selectedFantasyTeamFilter} options={fantasyTeamOptions} onValueChange={handleSelectedFantasyTeam} />
          <input type="search" autoComplete="off" value={searchTerm} onChange={handleSearchChange} placeholder="Search players..." className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500" />
          <button type="button" onClick={handleClearFilter} aria-disabled={filtersAreClear} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${filtersAreClear ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
            Clear Filters
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Draft Picks" value={draft.picks.length} />
          <StatCard label="Players Shown" value={filteredPicks.length} />
          <StatCard label="My Roster Size" value={myRosterSize} />
        </div>
        <PositionBreakdown players={breakdownPicks} />
        <PlayerList players={filteredPlayers} poolSlug={draftPoolSlug} />
      </div>
      <div role="tabpanel" id="best-available-panel" aria-labelledby="best-available-tab" hidden={activeDraftView !== "bestAvailable"}>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FilterSelect id="bestAvailablePosition" label="Filter by position" value={selectedBestAvailablePosition} options={positionOptions} onValueChange={handleBestAvailablePosition} />
          <input type="search" autoComplete="off" value={bestAvailableSearchTerm} onChange={(event) => setBestAvailableSearchTerm(event.target.value)} placeholder="Search available players..." className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500" />
          <button type="button" onClick={handleBestAvailableClearFilter} aria-disabled={bestAvailableFiltersAreClear} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${bestAvailableFiltersAreClear ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
            Clear Filters
          </button>
        </div>
        <BestAvailableDisplay players={filteredBestAvailablePlayers} selectedPosition={selectedBestAvailablePosition} poolSlug={draftPoolSlug} />
      </div>
    </section>
  );
}
