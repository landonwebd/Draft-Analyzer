import Link from "next/link";
import { BarChart3, Files, Layers3, Upload, MoveRight } from "lucide-react";

type HomeHeroProps = {
  rankingsAreAvailable: boolean;
  draftCount: number;
  poolCount: number;
  onImportDraft: () => void;
};

export default function HomeHero({ rankingsAreAvailable, draftCount, poolCount, onImportDraft }: HomeHeroProps) {
  return (
    <section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Fantasy Football</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">Draft Analyzer 1.0</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Analyze your drafts, discover your tendencies, and build a clearer picture of how you draft.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" onClick={onImportDraft} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500">
              <Upload size={20} aria-hidden="true" />
              Import Draft
            </button>
            {rankingsAreAvailable ? (
              <Link href="/rankings" className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-semibold text-white hover:border-slate-400 hover:bg-slate-900">
                <BarChart3 size={20} aria-hidden="true" />
                View Draft Rankings
              </Link>
            ) : (
              <span aria-disabled="true" title="Import and save a draft to view rankings" className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-500 opacity-60">
                <BarChart3 size={20} aria-hidden="true" />
                View Draft Rankings
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-500">Your imported drafts are stored only in this browser.</p>
        </div>
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">At a Glance</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <Files size={20} className="text-sky-400" aria-hidden="true" />
              <p className="mt-4 text-3xl font-bold tabular-nums">{draftCount}</p>
              <p className="mt-1 text-sm text-slate-400">{draftCount === 1 ? "Draft" : "Drafts"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <Layers3 size={20} className="text-emerald-400" aria-hidden="true" />
              <p className="mt-4 text-3xl font-bold tabular-nums">{poolCount}</p>
              <p className="mt-1 text-sm text-slate-400">{poolCount === 1 ? "Pool" : "Pools"}</p>
            </div>
          </div>
          {rankingsAreAvailable ? (
            <Link href="/analysis" className="group mt-4 block rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:border-emerald-700 hover:bg-slate-950">
              <p className="text-sm text-slate-400 group-hover:text-slate-300">Overall Draft Analysis</p>
              <p className="flex items-center gap-2 mt-1 font-semibold text-emerald-400">
                Explore your drafting tendencies <MoveRight aria-hidden="true" />
              </p>
            </Link>
          ) : (
            <div aria-disabled="true" className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Overall Draft Analysis</p>
              <p className="mt-1 font-semibold text-slate-500">Import a draft to begin</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
