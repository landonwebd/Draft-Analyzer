import { ChevronsUpDown } from "lucide-react";
import type { RankingSortField, SortDirection } from "@/types/draft";

type SortableHeaderProps = {
  label: string;
  field: RankingSortField;
  activeField: RankingSortField;
  sortDirection: SortDirection;
  onSort: (field: RankingSortField) => void;
  align?: "left" | "right";
};

export default function SortableHeader({ label, field, activeField, sortDirection, onSort, align = "left" }: SortableHeaderProps) {
  const isActive = field === activeField;
  const alignsRight = align === "right";

  return (
    <th className={`px-3 py-2 ${alignsRight ? "text-right" : ""}`} aria-sort={isActive ? sortDirection : "none"}>
      <button type="button" onClick={() => onSort(field)} className={`${isActive ? "text-white" : "text-slate-400"} whitespace-nowrap group flex cursor-pointer items-center gap-1 hover:text-white ${alignsRight ? "w-full justify-end" : ""}`}>
        {label}
        <ChevronsUpDown className={`shrink-0 size-4 ${isActive ? "text-white" : "text-slate-400"} group-hover:text-white`} aria-hidden="true" />
      </button>
    </th>
  );
}
