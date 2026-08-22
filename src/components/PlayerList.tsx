import type { Player } from "@/types/draft";
import { getPositionColor } from "@/utils/positionStyles";
import Link from "next/link";
import { createPlayerSlug } from "@/utils/createPlayerSlug";
import { createPlayerKey } from "@/utils/createPlayerKey";

type PlayerListProps = {
  players: Player[];
  poolSlug: string;
};

export default function PlayerList({ players, poolSlug }: PlayerListProps) {
  if (players.length === 0) {
    return <p className="mt-8 text-slate-400">No players match your filters.</p>;
  }

  return (
    <ul className="mt-8 space-y-2">
      {players.map((player) => {
        const playerKey = createPlayerKey(player.name, player.position, player.nflTeam);
        const playerSlug = createPlayerSlug(playerKey);
        return (
          <li key={player.id} className={`grid items-center gap-6 rounded-lg px-4 py-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] ${getPositionColor(player.position)}`}>
            <div className="flex gap-2 items-center">
              <Link
                href={{
                  pathname: `/players/${playerSlug}`,
                  query: {
                    pool: poolSlug,
                  },
                }}
                className="font-medium text-sky-300 hover:text-sky-200 hover:underline"
              >
                {player.name}
              </Link>
              <p className="text-slate-300">{player.nflTeam}</p>
              <p className="text-slate-300">{player.position}</p>
            </div>
            <div>
              <p className="truncate font-semibold text-slate-300">{player.fantasyTeam}</p>
            </div>
            <span className="text-slate-300 sm:text-right">Pick {player.pick}</span>
          </li>
        );
      })}
    </ul>
  );
}
