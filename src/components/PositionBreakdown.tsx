import type { Position } from "@/types/draft";
import { getPositionColor } from "@/utils/positionStyles";

type PositionBreakdownProps = {
  players: Array<{
    position: Position;
  }>;
};

type PositionCounts = Record<Position, number>;

const positions: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

const initialPositionCounts: PositionCounts = {
  QB: 0,
  RB: 0,
  WR: 0,
  TE: 0,
  K: 0,
  DST: 0,
};

export default function PositionBreakdown({ players }: PositionBreakdownProps) {
  const countByPosition = players.reduce(
    (counts, player) => {
      counts[player.position] += 1;
      return counts;
    },
    { ...initialPositionCounts },
  );
  return (
    <dl className="mt-8 grid grid-cols-3 gap-3 rounded-xl bg-slate-900 p-4 sm:grid-cols-6">
      {positions.map((position) => (
        <div key={position} className="text-center">
          <dt className={`rounded-md px-2 py-1 text-xs font-bold ${getPositionColor(position)}`}>{position}</dt>
          <dd className="mt-2 text-2xl font-bold">{countByPosition[position]}</dd>
        </div>
      ))}
    </dl>
  );
}
