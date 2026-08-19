import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  featured?: boolean;
  icon?: ReactNode;
};

export default function StatCard({ label, value, description, featured = false, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${featured ? "border-sky-500/40 bg-gradient-to-br from-sky-950/70 to-slate-950" : "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-slate-400">{label}</p>
        {icon && <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-800 text-sky-300">{icon}</span>}
      </div>
      <p className={`mt-2 text-3xl font-bold ${featured ? "text-sky-300" : "text-white"}`}>{value}</p>
      {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
    </div>
  );
}
