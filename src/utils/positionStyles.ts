import type { Position } from "@/types/draft";

function assertNever(value: never): never {
  throw new Error(`Unhandled position: ${value}`);
}

export function getPositionColor(position: Position) {
  switch (position) {
    case "QB":
      return "bg-red-900";
    case "RB":
      return "bg-emerald-900";
    case "WR":
      return "bg-sky-900";
    case "TE":
      return "bg-amber-800";
    case "K":
      return "bg-violet-900";
    case "DST":
      return "bg-slate-600";
    default:
      return assertNever(position);
  }
}
