"use client";

import { useEffect, useRef, useState } from "react";
import ImportedDraftCard from "@/components/ImportedDraftCard";
import HomeHero from "@/components/HomeHero";
import type { ImportedDraft, PendingDraft } from "@/types/draft";
import { Bomb, ChevronRight, ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import DraftPoolManager from "@/components/DraftPoolManager";
import { useDraftPools } from "@/hooks/useDraftPools";
import { useImportedDrafts } from "@/hooks/useImportedDrafts";
import { useGuestDataTransfer } from "@/hooks/useGuestDataTransfer";
import { convertFileToPendingDraft } from "@/utils/convertFileToPendingDraft";
import PendingDraftCard from "@/components/PendingDraftCard";
import { createFantasyTeamOptions } from "@/utils/createFantasyTeamOptions";
import FilterSelect from "@/components/FilterSelect";
import GuestDataTransferBanner from "@/components/GuestDataTransferBanner";
import FantasyProsImport from "@/components/FantasyProsImport";
import { DRAFT_SORT_STORAGE_KEY } from "@/utils/draftStorage";

const DRAFTS_PER_PAGE = 9;

type DraftSortOption = "newest" | "oldest" | "team-ascending" | "team-descending";

function isDraftSortOption(value: string | null): value is DraftSortOption {
  return value === "newest" || value === "oldest" || value === "team-ascending" || value === "team-descending";
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<PendingDraft[]>([]);
  const [showBoomConfirmation, setShowBoomConfirmation] = useState(false);
  const [currentDraftPage, setCurrentDraftPage] = useState(1);
  const [draftSortOption, setDraftSortOption] = useState<DraftSortOption>("newest");
  const [showImportWorkspace, setShowImportWorkspace] = useState(false);
  const { draftPools, draftPoolStorage, createDraftPool, renameDraftPool, deleteDraftPool, addMergedDraftPools } = useDraftPools();
  const { importedDrafts, hasLoadedImportedDrafts, createImportedDraft, deleteImportedDraft, assignImportedDraftToPool, importedDraftStorage, deleteAllImportedDrafts, unassignImportedDraftsFromPool, addMergedImportedDrafts } = useImportedDrafts();
  const accountStorageIsActive = draftPoolStorage === "database" && importedDraftStorage === "database";
  const { guestDrafts, guestDraftPools, hasGuestData, hasLoadedGuestData, deleteGuestBrowserData, moveGuestBrowserDataToAccount } = useGuestDataTransfer(accountStorageIsActive);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importWorkspaceRef = useRef<HTMLElement>(null);
  const rankingsAreAvailable = hasLoadedImportedDrafts && importedDrafts.length > 0;
  const totalDraftPages = Math.ceil(importedDrafts.length / DRAFTS_PER_PAGE);
  const sortedDrafts = [...importedDrafts];
  if (draftSortOption === "newest") {
    sortedDrafts.reverse();
  }
  if (draftSortOption === "team-ascending") {
    sortedDrafts.sort((draftA, draftB) => draftA.myFantasyTeam.localeCompare(draftB.myFantasyTeam));
  }
  if (draftSortOption === "team-descending") {
    sortedDrafts.sort((draftA, draftB) => draftB.myFantasyTeam.localeCompare(draftA.myFantasyTeam));
  }
  const firstDraftIndex = (currentDraftPage - 1) * DRAFTS_PER_PAGE;
  const visibleDrafts = sortedDrafts.slice(firstDraftIndex, firstDraftIndex + DRAFTS_PER_PAGE);
  const draftPoolOptions = [
    {
      value: "",
      label: "Leave unassigned",
    },
    ...draftPools.map((draftPool) => ({
      value: draftPool.id,
      label: draftPool.name,
    })),
  ];
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const timeoutId = window.setTimeout(() => {
      const storedDraftSortOption = window.localStorage.getItem(DRAFT_SORT_STORAGE_KEY);

      if (isDraftSortOption(storedDraftSortOption)) {
        setDraftSortOption(storedDraftSortOption);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);
  useEffect(() => {
    if (!showImportWorkspace) {
      return;
    }

    importWorkspaceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showImportWorkspace]);
  const draftSortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "team-ascending", label: "Team name A–Z" },
    { value: "team-descending", label: "Team name Z–A" },
  ];

  async function handleDeleteDraft(draftId: string) {
    const remainingDrafts = importedDrafts.filter((draft) => draft.id !== draftId);
    const remainingPageCount = Math.max(1, Math.ceil(remainingDrafts.length / DRAFTS_PER_PAGE));
    const draftWasDeleted = await deleteImportedDraft(draftId);
    if (!draftWasDeleted) {
      return;
    }
    setCurrentDraftPage((currentPage) => Math.min(currentPage, remainingPageCount));
  }

  async function handleDeleteAllDrafts() {
    const draftsWereDeleted = await deleteAllImportedDrafts();
    if (!draftsWereDeleted) {
      return;
    }
    setShowBoomConfirmation(false);
    setCurrentDraftPage(1);
  }

  async function handleAssignDraftToPool(draftId: string, poolId: string | undefined) {
    await assignImportedDraftToPool(draftId, poolId);
  }

  async function handleDeleteDraftPool(draftPoolId: string): Promise<boolean> {
    const poolWasDeleted = await deleteDraftPool(draftPoolId);

    if (!poolWasDeleted) {
      return false;
    }

    unassignImportedDraftsFromPool(draftPoolId);

    return true;
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setPendingDrafts([]);
      return;
    }

    setIsLoading(true);

    try {
      const nextPendingDrafts = await Promise.all(files.map((file) => convertFileToPendingDraft(file)));
      setPendingDrafts(nextPendingDrafts);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handlePendingTeamChange(pendingDraftId: string, selectedTeam: string) {
    setPendingDrafts((currentDrafts) => currentDrafts.map((pendingDraft) => (pendingDraft.id === pendingDraftId ? { ...pendingDraft, selectedTeam } : pendingDraft)));
  }

  function handlePendingPoolChange(pendingDraftId: string, selectedPoolId: string) {
    setPendingDrafts((currentDrafts) => currentDrafts.map((pendingDraft) => (pendingDraft.id === pendingDraftId ? { ...pendingDraft, selectedPoolId } : pendingDraft)));
  }

  async function handleSavePendingDraft(pendingDraftId: string) {
    const pendingDraft = pendingDrafts.find((draft) => draft.id === pendingDraftId);
    if (!pendingDraft) {
      return;
    }
    const isFantasyProsDraft = pendingDraft.fileName.startsWith("fantasypros-");
    const isDuplicate = importedDrafts.some((draft) => draft.sourceFileName === pendingDraft.fileName);
    if (pendingDraft.selectedTeam === "" || pendingDraft.picks.length === 0 || pendingDraft.importError !== "" || isDuplicate) {
      return;
    }
    const importedDraft: ImportedDraft = {
      id: crypto.randomUUID(),
      name: isFantasyProsDraft
        ? "FantasyPros Mock Draft"
        : pendingDraft.fileName
            .replace(/\.(csv|json)$/i, "")
            .replace(/-+/g, " ")
            .trim(),
      sourceFileName: pendingDraft.fileName,
      importedAt: new Date().toISOString(),
      myFantasyTeam: pendingDraft.selectedTeam,
      poolId: pendingDraft.selectedPoolId || undefined,
      picks: pendingDraft.picks,
    };
    const draftWasCreated = await createImportedDraft(importedDraft);
    if (!draftWasCreated) {
      return;
    }
    setCurrentDraftPage(1);
    setPendingDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== pendingDraftId));
  }

  function handleRemovePendingDraft(pendingDraftId: string) {
    setPendingDrafts((currentDrafts) => currentDrafts.filter((pendingDraft) => pendingDraft.id !== pendingDraftId));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePreviousDraftPage() {
    setCurrentDraftPage((currentPage) => Math.max(currentPage - 1, 1));
  }

  function handleNextDraftPage() {
    setCurrentDraftPage((currentPage) => Math.min(currentPage + 1, totalDraftPages));
  }

  function pendingDraftCannotBeSaved(pendingDraft: PendingDraft) {
    const isDuplicate = importedDrafts.some((draft) => draft.sourceFileName === pendingDraft.fileName);
    return pendingDraft.selectedTeam === "" || pendingDraft.picks.length === 0 || pendingDraft.importError !== "" || isDuplicate;
  }

  async function handleMoveGuestDataToAccount(): Promise<boolean> {
    const mergeResult = await moveGuestBrowserDataToAccount(draftPools, importedDrafts);
    if (!mergeResult) {
      return false;
    }
    addMergedDraftPools(mergeResult.createdDraftPools);
    addMergedImportedDrafts(mergeResult.createdDrafts);

    return true;
  }

  return (
    <main className="bg-slate-950 px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <HomeHero rankingsAreAvailable={rankingsAreAvailable} draftCount={importedDrafts.length} poolCount={draftPools.length} onImportDraft={() => setShowImportWorkspace(true)} />
        {hasLoadedGuestData && hasGuestData && <GuestDataTransferBanner guestDraftCount={guestDrafts.length} guestDraftPoolCount={guestDraftPools.length} onDeleteGuestData={deleteGuestBrowserData} onMoveGuestData={handleMoveGuestDataToAccount} />}
        {showImportWorkspace && (
          <section ref={importWorkspaceRef} id="import-drafts" className="mt-12 scroll-mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Import Drafts</h2>
                <p className="mt-2 text-sm text-slate-400">Add draft results from one of the supported fantasy platforms.</p>
              </div>
              <button type="button" onClick={() => setShowImportWorkspace(false)} aria-label="Close import drafts panel" title="Close" className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800 hover:text-white">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:items-start">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
                <h3 id="draftUploadDescription" className="text-lg font-bold text-white">
                  CSV Import
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Import draft results downloaded from{" "}
                  <Link href="/rtsports-csv-instructions.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
                    RTSports
                  </Link>{" "}
                  or exported from{" "}
                  <Link href="/espn-draft-export.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
                    ESPN
                  </Link>
                  .
                </p>
                <input ref={fileInputRef} id="resultsUpload" type="file" accept=".csv,text/csv" multiple onChange={handleFileChange} className="mt-2 block w-full max-w-md cursor-pointer rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-emerald-600 file:px-5 file:py-3 file:font-semibold file:text-white hover:file:bg-emerald-500" aria-labelledby="draftUploadDescription" />
                {isLoading && (
                  <div className="relative h-16">
                    <span className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-r-amber-500 border-b-amber-500 border-t-amber-500" />
                  </div>
                )}
              </div>
              <FantasyProsImport
                storage={importedDraftStorage}
                existingSourceFileNames={[...importedDrafts.map((draft) => draft.sourceFileName), ...pendingDrafts.map((draft) => draft.fileName)]}
                onAddPendingDraft={(newDraft) => {
                  setPendingDrafts((currentDrafts) => [...currentDrafts, newDraft]);
                }}
              />
            </div>
            {pendingDrafts.length > 0 && (
              <section className="mt-6">
                <h2 className="text-xl font-bold">Pending Imports ({pendingDrafts.length})</h2>

                <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pendingDrafts.map((pendingDraft) => (
                    <PendingDraftCard key={pendingDraft.id} pendingDraft={pendingDraft} teamOptions={createFantasyTeamOptions(pendingDraft.picks)} poolOptions={draftPoolOptions} cannotBeSaved={pendingDraftCannotBeSaved(pendingDraft)} isDuplicate={importedDrafts.some((draft) => draft.sourceFileName === pendingDraft.fileName)} onTeamChange={handlePendingTeamChange} onPoolChange={handlePendingPoolChange} onSave={handleSavePendingDraft} onRemove={handleRemovePendingDraft} />
                  ))}
                </ul>
              </section>
            )}
          </section>
        )}
        <DraftPoolManager draftPools={draftPools} draftPoolStorage={draftPoolStorage} onCreateDraftPool={createDraftPool} onRenameDraftPool={renameDraftPool} onDeleteDraftPool={handleDeleteDraftPool} importedDrafts={importedDrafts} />
        <section className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Drafts</h2>
              <p className="mt-2 text-sm text-slate-400">
                {importedDrafts.length === 1 ? "1 imported draft" : `${importedDrafts.length} imported drafts`}
                {draftPools.length > 0 && ` across ${draftPools.length} ${draftPools.length === 1 ? "pool" : "pools"}`}.
              </p>
            </div>
            {importedDrafts.length > 1 && (
              <div>
                <p className="mb-2 text-sm text-slate-400">Sort Drafts</p>
                <FilterSelect
                  id="draftSort"
                  label="Sort drafts"
                  value={draftSortOption}
                  options={draftSortOptions}
                  onChange={(event) => {
                    const nextDraftSortOption = event.target.value as DraftSortOption;
                    setDraftSortOption(nextDraftSortOption);
                    window.localStorage.setItem(DRAFT_SORT_STORAGE_KEY, nextDraftSortOption);
                    setCurrentDraftPage(1);
                  }}
                />
              </div>
            )}
            {importedDrafts.length > DRAFTS_PER_PAGE && (
              <div className="flex items-center gap-4">
                <button type="button" aria-label="Previous page" onClick={handlePreviousDraftPage} disabled={currentDraftPage === 1} className="cursor-pointer rounded-lg border border-slate-700 p-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft aria-hidden="true" />
                </button>
                <p className="text-sm text-slate-400">
                  Page {currentDraftPage} of {totalDraftPages}
                </p>
                <button type="button" aria-label="Next page" onClick={handleNextDraftPage} disabled={currentDraftPage === totalDraftPages} className="cursor-pointer rounded-lg border border-slate-700 p-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          {importedDrafts.length === 0 ? (
            <p className="mt-4 text-slate-400">No drafts have been saved yet.</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleDrafts.map((draft) => (
                <ImportedDraftCard key={draft.id} draft={draft} onDelete={handleDeleteDraft} draftPools={draftPools} onAssignDraftToPool={handleAssignDraftToPool} />
              ))}
            </div>
          )}
          {importedDraftStorage === "guest" && importedDrafts.length !== 0 && (
            <section className="w-full md:w-1/2 lg:w-1/3 mx-auto mt-10 rounded-2xl border border-red-900/70 bg-red-950/20 p-6">
              <h3 className="text-lg font-bold text-red-300">Danger Zone</h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">Permanently delete all imported drafts and their draft picks saved in this browser. Your Draft Pools will not be deleted.</p>

              <button type="button" onClick={() => setShowBoomConfirmation(true)} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-800 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/60">
                <Bomb aria-hidden="true" />
                Delete All Drafts
              </button>
            </section>
          )}
          {importedDraftStorage === "guest" && showBoomConfirmation && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div role="dialog" aria-modal="true" aria-labelledby="boom-dialog-title" className="w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-red-950/50">
                <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-700 bg-red-950 text-red-300">
                  <Bomb className="size-7" aria-hidden="true" />
                </div>
                <h3 id="boom-dialog-title" className="mt-4 text-center text-2xl font-bold">
                  Delete all imported drafts?
                </h3>
                <p className="mt-3 text-center text-slate-300">
                  You are about to permanently delete all <strong className="text-white">{importedDrafts.length} imported drafts</strong> from this browser.
                </p>
                <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-red-400">This action cannot be undone.</p>
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <button type="button" onClick={() => setShowBoomConfirmation(false)} className="cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800">
                    Never mind
                  </button>
                  <button type="button" onClick={handleDeleteAllDrafts} className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-500">
                    BOOM! Delete everything
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
