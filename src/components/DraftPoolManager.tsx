"use client";

import { useState } from "react";
import type { DraftPool, ImportedDraft } from "@/types/draft";
import { Bomb, Settings } from "lucide-react";

type DraftPoolManagerProps = {
  draftPools: DraftPool[];
  importedDrafts: ImportedDraft[];
  onCreateDraftPool: (name: string) => boolean;
  onDeleteDraftPool: (draftPoolId: string) => void;
  onRenameDraftPool: (draftPoolId: string, nextName: string) => boolean;
};

export default function DraftPoolManager({ draftPools, importedDrafts, onCreateDraftPool, onRenameDraftPool, onDeleteDraftPool }: DraftPoolManagerProps) {
  const [draftPoolName, setDraftPoolName] = useState("");
  const [createPoolError, setCreatePoolError] = useState("");
  const [editingDraftPoolId, setEditingDraftPoolId] = useState<string | null>(null);
  const [draftPoolRename, setDraftPoolRename] = useState("");
  const [renamePoolError, setRenamePoolError] = useState("");
  const [draftPoolPendingDeletion, setDraftPoolPendingDeletion] = useState<DraftPool | null>(null);
  const [showPoolManagement, setShowPoolManagement] = useState(false);
  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = draftPoolName.trim();
    if (trimmedName === "") {
      return;
    }
    const poolWasCreated = onCreateDraftPool(trimmedName);
    if (!poolWasCreated) {
      setCreatePoolError("Choose a unique pool name containing letters or numbers.");
      return;
    }
    setCreatePoolError("");
    setDraftPoolName("");
  }

  function handleStartRename(draftPool: DraftPool) {
    setEditingDraftPoolId(draftPool.id);
    setDraftPoolRename(draftPool.name);
    setRenamePoolError("");
  }

  function handleSaveRename() {
    if (editingDraftPoolId === null) {
      return;
    }
    const poolWasRenamed = onRenameDraftPool(editingDraftPoolId, draftPoolRename);
    if (!poolWasRenamed) {
      setRenamePoolError("Choose a unique pool name containing letters or numbers.");
      return;
    }
    setEditingDraftPoolId(null);
    setDraftPoolRename("");
    setRenamePoolError("");
  }

  function handleCancelRename() {
    setEditingDraftPoolId(null);
    setDraftPoolRename("");
    setRenamePoolError("");
  }

  function handleConfirmDeletePool() {
    if (draftPoolPendingDeletion === null) {
      return;
    }
    onDeleteDraftPool(draftPoolPendingDeletion.id);
    setDraftPoolPendingDeletion(null);
  }

  return (
    <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Draft Pools</h2>
          <p className="mt-2 text-sm text-slate-400">{draftPools.length === 1 ? "1 pool created." : `${draftPools.length} pools created.`} Organize and compare your drafts by league format.</p>
        </div>
        <button type="button" onClick={() => setShowPoolManagement((currentValue) => !currentValue)} className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white">
          <Settings size={18} aria-hidden="true" />
          {showPoolManagement ? "Done Managing" : "Manage Pools"}
        </button>
      </div>
      {draftPools.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draftPools.map((draftPool) => {
            const assignedDraftCount = importedDrafts.filter((draft) => draft.poolId === draftPool.id).length;

            return (
              <li key={draftPool.id} className="rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-4">
                <p className="font-bold text-white">{draftPool.name}</p>

                <p className="mt-1 text-sm text-slate-400">{assignedDraftCount === 1 ? "1 draft" : `${assignedDraftCount} drafts`}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-slate-700 px-5 py-4 text-sm text-slate-400">No draft pools yet. Select Manage Pools to create one.</p>
      )}
      {showPoolManagement && (
        <div className="mt-6">
          <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
            <input type="text" value={draftPoolName} onChange={(event) => setDraftPoolName(event.target.value)} placeholder="Enter a pool name..." className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500" />
            <button type="submit" disabled={draftPoolName.trim() === ""} className="rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white enabled:cursor-pointer enabled:hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40">
              Create Pool
            </button>
          </form>
          {createPoolError && (
            <p role="alert" className="mt-2 text-sm text-red-300">
              {createPoolError}
            </p>
          )}
          {draftPools.length > 0 && (
            <ul className="mt-5 space-y-2">
              {draftPools.map((draftPool) => (
                <li key={draftPool.id} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    {editingDraftPoolId === draftPool.id ? (
                      <input
                        type="text"
                        value={draftPoolRename}
                        onChange={(event) => {
                          setDraftPoolRename(event.target.value);
                          setRenamePoolError("");
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white"
                      />
                    ) : (
                      <span className="font-medium">{draftPool.name}</span>
                    )}
                    <div className="flex shrink-0 gap-3">
                      {editingDraftPoolId === draftPool.id ? (
                        <>
                          <button type="button" onClick={handleSaveRename} disabled={draftPoolRename.trim() === ""} className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white enabled:cursor-pointer enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
                            Save
                          </button>

                          <button type="button" onClick={handleCancelRename} className="cursor-pointer rounded-lg border border-slate-600 px-4 py-3 font-semibold text-slate-300 hover:bg-slate-800">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => handleStartRename(draftPool)} className="cursor-pointer rounded-lg border border-slate-600 px-4 py-3 font-semibold text-slate-300 hover:bg-slate-800">
                            Rename
                          </button>
                          <button type="button" onClick={() => setDraftPoolPendingDeletion(draftPool)} className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500">
                            Delete Pool
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingDraftPoolId === draftPool.id && renamePoolError && (
                    <p role="alert" className="mt-2 text-sm text-red-300">
                      {renamePoolError}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {draftPoolPendingDeletion && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-pool-dialog-title" className="w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-red-950/50">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-700 bg-red-950 text-red-300">
              <Bomb className="size-7" aria-hidden="true" />
            </div>
            <h3 id="delete-pool-dialog-title" className="mt-4 text-center text-2xl font-bold">
              Delete {draftPoolPendingDeletion.name}?
            </h3>
            <p className="mt-3 text-center text-slate-300">
              The pool will be permanently deleted. Drafts currently assigned to it will become <span className="font-semibold text-white">Unassigned</span>.
            </p>
            <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-red-400">This action cannot be undone.</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setDraftPoolPendingDeletion(null)} className="cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800">
                Never mind
              </button>
              <button type="button" onClick={handleConfirmDeletePool} className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-500">
                Delete pool
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
