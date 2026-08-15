import type { Player } from "@/types/draft";
import { getPositionColor } from "@/utils/positionStyles";

type PlayerListProps = {
  players: Player[];
};

export default function PlayerList({ players }: PlayerListProps) {
  if (players.length === 0) {
    return <p className="mt-8 text-slate-400">No players match your filters.</p>;
  }

  return (
    <ul className="mt-8 space-y-2">
      {players.map((player) => (
        <li key={player.id} className={`grid items-center gap-6 rounded-lg px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] ${getPositionColor(player.position)}`}>
          <div className="flex gap-2 items-center">
            <p className="font-semibold">{player.name}</p>
            <p className="text-slate-400">{player.position}</p>
          </div>
          <div>
            <p className="truncate font-semibold text-slate-400">{player.fantasyTeam}</p>
          </div>

          <span className="text-slate-300 sm:text-right">Pick {player.pick}</span>
        </li>
      ))}
    </ul>
  );
}
