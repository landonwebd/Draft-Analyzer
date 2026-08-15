"use client";

import { useEffect, useState } from "react";
import type { ImportedDraft, PositionFilter } from "@/types/draft";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";
import FilterSelect from "@/components/FilterSelect";
import PlayerList from "@/components/PlayerList";
import StatCard from "@/components/StatCard";
import PositionBreakdown from "@/components/PositionBreakdown";
import { convertDraftPicksToPlayers } from "@/utils/draftTransforms";

type PositionOption = {
  value: PositionFilter;
  label: string;
};

const positionOptions: PositionOption[] = [
  { value: "ALL", label: "Show all players" },
  { value: "QB", label: "Quarterback" },
  { value: "RB", label: "Running Back" },
  { value: "WR", label: "Wide Receiver" },
  { value: "TE", label: "Tight End" },
  { value: "K", label: "Kicker" },
  { value: "DST", label: "Defense / Special Teams" },
];

type DraftAnalysisProps = {
  draftId: string;
};

export default function DraftAnalysis({ draftId }: DraftAnalysisProps) {
  const [draft, setDraft] = useState<ImportedDraft | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>("ALL");
  const [selectedFantasyTeamFilter, setSelectedFantasyTeamFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const filtersAreClear = selectedPosition === "ALL" && searchTerm === "" && selectedFantasyTeamFilter === "ALL";
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(DRAFT_STORAGE_KEY);

        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);

          if (Array.isArray(parsedValue)) {
            const storedDrafts = parsedValue as ImportedDraft[];
            const matchingDraft = storedDrafts.find((storedDraft) => storedDraft.id === draftId);

            setDraft(matchingDraft ?? null);
          }
        }
      } catch (error) {
        console.error("Unable to load saved draft:", error);
      } finally {
        setHasLoaded(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftId]);

  function handleSelectedPosition(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedPosition(event.target.value as PositionFilter);
  }

  function handleSelectedFantasyTeam(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedFantasyTeamFilter(event.target.value);
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

  if (!hasLoaded) {
    return <p className="mt-4 text-slate-300">Loading draft...</p>;
  }

  if (!draft) {
    return <p className="mt-4 text-red-300">Draft not found.</p>;
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
      <h1 className="text-4xl font-bold">{draft.name}</h1>
      <p className="mt-3 text-slate-300">
        Your fantasy team: <span className="font-bold text-white">{draft.myFantasyTeam}</span>
      </p>
      <p className="mt-1 text-slate-400">{draft.picks.length} total draft picks</p>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <FilterSelect id="positionFilter" label="Filter by position" value={selectedPosition} options={positionOptions} onChange={handleSelectedPosition} />
        <FilterSelect id="fantasyTeamFilter" label="Filter by Fantasy Team" value={selectedFantasyTeamFilter} options={fantasyTeamOptions} onChange={handleSelectedFantasyTeam} />
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
      <PlayerList players={filteredPlayers} />
    </section>
  );
}
