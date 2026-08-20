import type { PlayerRanking, PositionFilter } from "@/types/draft";
import Link from "next/link";
import { createPlayerSlug } from "@/utils/createPlayerSlug";
import { createPlayerKey } from "@/utils/createPlayerKey";
import { useState } from "react";

type BestAvailableDisplayProps = {
  players: PlayerRanking[];
  selectedPosition: PositionFilter;
  draftId: string;
};

export default function BestAvailableDisplay({ players, selectedPosition, draftId }: BestAvailableDisplayProps) {
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const visiblePlayers = showAllPlayers ? players : players.slice(0, 10);
  return (
    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-2xl font-bold">Best Available</h2>
      <p className="mt-2 text-slate-400">{selectedPosition === "ALL" ? `${players.length} ranked players went undrafted in this imported draft.` : `${players.length} ${selectedPosition}s went undrafted in this imported draft.`}</p>
      <div className="mt-6 overflow-x-auto">
        {players.length === 0 ? (
          <p className="mt-6 rounded-lg border border-slate-800 bg-slate-950/60 p-5 text-slate-400">No available players match these filters.</p>
        ) : (
          <>
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-slate-700 text-sm text-slate-400">
                <tr>
                  <th className="px-3 py-3">Personalized ADP</th>
                  <th className="px-3 py-3">Player</th>
                  <th className="px-3 py-3">Position</th>
                  <th className="px-3 py-3 text-right">Overall Avg.</th>
                  <th className="px-3 py-3 text-right">% Drafted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visiblePlayers.map((player) => {
                  const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);
                  const playerSlug = createPlayerSlug(playerKey);
                  return (
                    <tr key={`${player.playerName}-${player.position}-${player.nflTeam}`}>
                      <td className="px-3 py-3">{player.finalPersonalizedAdp.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <Link href={`/players/${playerSlug}?fromDraft=${encodeURIComponent(draftId)}`} className="font-medium text-sky-300 hover:text-sky-200 hover:underline">
                          {player.playerName}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {player.position}
                        {player.positionRank}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{player.averageOverallPick.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {(player.draftRate * 100).toFixed(0)}%
                        <span className="ml-2 text-xs text-slate-500">
                          ({player.timesDrafted}/{player.totalDrafts})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {players.length > 10 && (
              <button type="button" onClick={() => setShowAllPlayers((currentValue) => !currentValue)} className="mt-5 cursor-pointer rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">
                {showAllPlayers ? "Show fewer players" : `Show ${players.length - 10} more players`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
