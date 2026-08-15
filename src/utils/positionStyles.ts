import type { Position } from "@/types/draft";

function assertNever(value: never): never {
  throw new Error(`Unhandled position: ${value}`);
}

export function getPositionColor(position: Position) {
  switch (position) {
    case "QB":
      return "bg-rose-950";
    case "RB":
      return "bg-emerald-950";
    case "WR":
      return "bg-sky-950";
    case "TE":
      return "bg-lime-700";
    case "K":
      return "bg-fuchsia-950";
    case "DST":
      return "bg-orange-950";
    default:
      return assertNever(position);
  }
}
