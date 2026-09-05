import FilterSelect from "@/components/FilterSelect";
import type { SelectOption } from "@/components/FilterSelect";
import type { PendingDraft } from "@/types/draft";

type PendingDraftCardProps = {
  pendingDraft: PendingDraft;
  teamOptions: SelectOption[];
  poolOptions: SelectOption[];
  cannotBeSaved: boolean;
  isDuplicate: boolean;
  onTeamChange: (pendingDraftId: string, selectedTeam: string) => void;
  onPoolChange: (pendingDraftId: string, selectedPoolId: string) => void;
  onSave: (pendingDraftId: string) => void;
  onRemove: (pendingDraftId: string) => void;
};

export default function PendingDraftCard({ pendingDraft, teamOptions, poolOptions, cannotBeSaved, isDuplicate, onTeamChange, onPoolChange, onSave, onRemove }: PendingDraftCardProps) {
  return (
    <li className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800/60 p-5 shadow-sm">
      <p className="truncate text-lg font-bold" title={pendingDraft.fileName}>
        {pendingDraft.fileName}
      </p>
      {pendingDraft.importError ? <p className="mt-2 text-sm text-red-300">{pendingDraft.importError}</p> : <p className="mt-2 text-sm text-slate-400">{pendingDraft.picks.length} picks found</p>}
      <div className="mt-auto pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Choose Fantasy Team <span className="text-sky-500">*</span>
        </p>
        <FilterSelect id={`pendingTeam-${pendingDraft.id}`} label={`Select your team for ${pendingDraft.fileName}`} value={pendingDraft.selectedTeam} options={teamOptions} onValueChange={(value) => onTeamChange(pendingDraft.id, value)} />
        <p className="my-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose Draft Pool</p>
        <FilterSelect id={`pendingPool-${pendingDraft.id}`} label={`Select a draft pool for ${pendingDraft.fileName}`} value={pendingDraft.selectedPoolId} options={poolOptions} onValueChange={(value) => onPoolChange(pendingDraft.id, value)} />
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => onSave(pendingDraft.id)} aria-disabled={cannotBeSaved} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${cannotBeSaved ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
            Save this draft
          </button>
          <button type="button" onClick={() => onRemove(pendingDraft.id)} className="cursor-pointer rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">
            Remove from list
          </button>
        </div>
        {isDuplicate && <p className="mt-3 text-sm text-amber-300">This draft has already been imported.</p>}
      </div>
    </li>
  );
}
