import type { PositionFilter } from "@/types/draft";

export type PositionOption = {
  value: PositionFilter;
  label: string;
};

export const positionOptions: PositionOption[] = [
  { value: "ALL", label: "Show all players" },
  { value: "QB", label: "Quarterback" },
  { value: "RB", label: "Running Back" },
  { value: "WR", label: "Wide Receiver" },
  { value: "TE", label: "Tight End" },
  { value: "K", label: "Kicker" },
  { value: "DST", label: "Defense / Special Teams" },
];
