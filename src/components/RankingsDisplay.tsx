"use client";

import { useState, useEffect } from "react";
import type { ImportedDraft, PlayerRanking, PositionFilter, RankingSortField, SortDirection } from "@/types/draft";
import FilterSelect from "@/components/FilterSelect";
import SortableHeader from "@/components/SortableHeader";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";
import { buildPlayerRankings } from "@/utils/buildPlayerRankings";
import { positionOptions } from "@/utils/positionOptions";
import { createRankingsCsv } from "@/utils/createRankingsCsv";
import { Download } from "lucide-react";

export default function RankingsDisplay() {
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>("ALL");
  const [sortField, setSortField] = useState<RankingSortField>("weightedScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ascending");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const filteredRankings = rankings.filter((player) => {
    const matchesPosition = selectedPosition === "ALL" || player.position === selectedPosition;
    const matchesSearch = player.playerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPosition && matchesSearch;
  });
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedValue = window.localStorage.getItem(DRAFT_STORAGE_KEY);

      if (storedValue) {
        const drafts = JSON.parse(storedValue) as ImportedDraft[];
        setRankings(buildPlayerRankings(drafts));
      }

      setHasLoaded(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

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

  if (!hasLoaded) {
    return <p className="mt-8 text-slate-300">Building rankings...</p>;
  }

  if (rankings.length === 0) {
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

  return (
    <div className="mt-8">
      <div className="grid grid-cols-[repeat(4,auto)] gap-4">
        <FilterSelect id="rankingPositionFilter" label="Filter rankings by position" value={selectedPosition} options={positionOptions} onChange={handleSelectedPosition} />
        <input type="search" autoComplete="off" value={searchTerm} onChange={handleSearchChange} placeholder="Search players..." className="w-full rounded-lg border border-slate-500 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500" />
        <button type="button" onClick={handleClearFilter} aria-disabled={filtersAreClear} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${filtersAreClear ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
          Clear Filters
        </button>
        <button type="button" onClick={handleExportRankings} aria-label="Export rankings as CSV" title="Export rankings as CSV" aria-disabled={sortedRankings.length === 0} className="w-fit rounded-lg border border-slate-700 px-4 py-3 text-slate-300 cursor-pointer hover:bg-slate-800">
          <Download />
        </button>
      </div>
      <div className="mt-6 overflow-x-auto">
        <p className="text-sm mb-2 text-slate-300">
          A <span className="font-semibold">meaningful pass</span> occurs when a player was available near one of your picks, but you selected someone with a later overall average draft position.
        </p>
        <table className="w-full min-w-[1050px] table-fixed text-left">
          <colgroup>
            <col className="w-32" />
            <col className="w-64" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-36" />
          </colgroup>
          <thead className="border-b border-slate-700 text-sm text-slate-400">
            <tr>
              <SortableHeader label="Personalized ADP" field="weightedScore" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <th className="w-64 px-3 py-2">
                Player <span className="text-xs font-normal">(meaningful pass)</span>
              </th>
              <th className="px-3 py-2">Position</th>
              <SortableHeader label="My Drafts" field="myDraftCount" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
              <SortableHeader label="My Avg. Pick" field="myAverageOverallPick" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
              <SortableHeader label="Overall Avg." field="averageOverallPick" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
              <SortableHeader label="% Drafted" field="draftRate" activeField={sortField} sortDirection={sortDirection} onSort={handleSort} align="right" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {sortedRankings.map((player) => (
              <tr key={player.playerName}>
                <td className="text-left px-3 py-3 tabular-nums">{player.weightedScore.toFixed(2)}</td>
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 truncate" title={player.playerName}>
                      {player.playerName}
                    </span>
                    {player.meaningfulPassCount > 0 && <span className="shrink-0 text-xs font-normal text-slate-500">({player.meaningfulPassCount})</span>}
                  </div>
                </td>
                <td className="px-3 py-3">{player.position}</td>
                <td className="px-3 py-3 text-right tabular-nums">{player.myDraftCount}</td>
                <td className="px-3 py-3 text-right tabular-nums">{player.myAverageOverallPick === null ? "—" : player.myAverageOverallPick.toFixed(1)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{player.averageOverallPick.toFixed(1)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {(player.draftRate * 100).toFixed(0)}%
                  <span className="ml-2 text-xs text-slate-500">
                    ({player.timesDrafted}/{player.totalDrafts})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
