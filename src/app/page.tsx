"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import FilterSelect from "@/components/FilterSelect";
import ImportedDraftCard from "@/components/ImportedDraftCard";
import type { DraftPick, ImportedDraft, Position, PendingDraft } from "@/types/draft";
import type { FantasyProsDraftResponse } from "@/types/fantasyPros";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";
import { Bomb, MoveRight, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { buildFantasyProsPlayerLookup } from "@/utils/buildFantasyProsPlayerLookup";
import { convertFantasyProsDraft } from "@/utils/convertFantasyProsDraft";
import { getFantasyProsPlayers } from "@/utils/getFantasyProsPlayers";
import { isFantasyProsDraftResponse } from "@/utils/isFantasyProsDraftResponse";

type CsvRow = Record<string, string>;

const requiredHeaders = ["OVERALL", "PICK", "PLAYER", "POS", "TEAM"];
const DRAFTS_PER_PAGE = 9;

function isPosition(value: string): value is Position {
  return ["QB", "RB", "WR", "TE", "K", "DST"].includes(value);
}

function normalizePosition(value: string): Position | null {
  if (value === "Def/ST" || value === "D/ST") {
    return "DST";
  }
  if (value === "WRCB") {
    return "WR";
  }
  if (isPosition(value)) {
    return value;
  }
  return null;
}

function convertCsvRowsToDraftPicks(rows: CsvRow[]): DraftPick[] {
  const importedPicks: DraftPick[] = [];
  for (const row of rows) {
    const position = normalizePosition(row.POS);
    if (!position) {
      continue;
    }
    const draftPick: DraftPick = {
      overall: Number(row.OVERALL),
      pick: row.PICK,
      playerName: row.PLAYER,
      position,
      nflTeam: row.NFL,
      fantasyTeam: row.TEAM,
    };
    importedPicks.push(draftPick);
  }
  return importedPicks;
}

async function convertFileToPendingDraft(file: File): Promise<PendingDraft> {
  const contents = await file.text();

  const result = Papa.parse<CsvRow>(contents, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  const importError = missingHeaders.length > 0 ? `Missing required columns: ${missingHeaders.join(", ")}` : "";

  const picks = importError === "" ? convertCsvRowsToDraftPicks(result.data) : [];

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    picks,
    selectedTeam: "",
    importError,
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [importedDrafts, setImportedDrafts] = useState<ImportedDraft[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<PendingDraft[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [fantasyProsUrl, setFantasyProsUrl] = useState("");
  const [isFantasyProsImporting, setIsFantasyProsImporting] = useState(false);
  const [fantasyProsImportError, setFantasyProsImportError] = useState("");
  const [showBoomConfirmation, setShowBoomConfirmation] = useState(false);
  const [currentDraftPage, setCurrentDraftPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rankingsAreAvailable = hasLoadedStorage && importedDrafts.length > 0;
  const totalDraftPages = Math.ceil(importedDrafts.length / DRAFTS_PER_PAGE);
  const newestDrafts = [...importedDrafts].reverse();
  const firstDraftIndex = (currentDraftPage - 1) * DRAFTS_PER_PAGE;
  const visibleDrafts = newestDrafts.slice(firstDraftIndex, firstDraftIndex + DRAFTS_PER_PAGE);

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);
  useEffect(() => {
    const timeoutID = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);
          if (Array.isArray(parsedValue)) {
            setImportedDrafts(parsedValue as ImportedDraft[]);
          }
        }
      } catch (error) {
        console.error("Unable to load saved drafts:", error);
      } finally {
        setHasLoadedStorage(true);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutID);
    };
  }, []);
  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(importedDrafts));
  }, [importedDrafts, hasLoadedStorage]);

  function handleDeleteDraft(draftId: string) {
    const remainingDrafts = importedDrafts.filter((draft) => draft.id !== draftId);

    const remainingPageCount = Math.max(1, Math.ceil(remainingDrafts.length / DRAFTS_PER_PAGE));

    setImportedDrafts(remainingDrafts);

    setCurrentDraftPage((currentPage) => Math.min(currentPage, remainingPageCount));
  }

  function handleDeleteAllDrafts() {
    if (importedDrafts.length === 0) {
      return;
    }
    setImportedDrafts([]);
    setShowBoomConfirmation(false);
    setCurrentDraftPage(1);
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

  function handlePendingTeamChange(pendingDraftId: string, event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedTeam = event.target.value;
    setPendingDrafts((currentDrafts) => currentDrafts.map((pendingDraft) => (pendingDraft.id === pendingDraftId ? { ...pendingDraft, selectedTeam } : pendingDraft)));
  }

  function createFantasyTeamOptions(picks: DraftPick[]) {
    const fantasyTeams = [...new Set(picks.map((pick) => pick.fantasyTeam).filter((team): team is string => Boolean(team)))].sort((firstTeam, secondTeam) =>
      firstTeam.localeCompare(secondTeam, undefined, {
        sensitivity: "base",
      }),
    );

    return [
      { value: "", label: "Select your fantasy team" },
      ...fantasyTeams.map((fantasyTeam) => ({
        value: fantasyTeam,
        label: fantasyTeam,
      })),
    ];
  }

  function handleSavePendingDraft(pendingDraftId: string) {
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
      name: isFantasyProsDraft ? "FantasyPros Mock Draft" : pendingDraft.fileName.replace(/\.(csv|json)$/i, ""),
      sourceFileName: pendingDraft.fileName,
      importedAt: new Date().toISOString(),
      myFantasyTeam: pendingDraft.selectedTeam,
      picks: pendingDraft.picks,
    };
    setImportedDrafts((currentDrafts) => [...currentDrafts, importedDraft]);
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

  async function addFantasyProsPendingDraft(draftResponse: FantasyProsDraftResponse, sourceFileName: string) {
    const playersResponse = await getFantasyProsPlayers();
    const playerLookup = buildFantasyProsPlayerLookup(playersResponse.players);
    const convertedPicks = convertFantasyProsDraft(draftResponse, playerLookup);

    const userPick = draftResponse.picks.find((pick) => pick.isUserTeam);
    const selectedTeam = userPick?.owner ?? "";

    setPendingDrafts((currentDrafts) => [
      ...currentDrafts,
      {
        id: crypto.randomUUID(),
        fileName: sourceFileName,
        picks: convertedPicks,
        selectedTeam,
        importError: selectedTeam === "" ? "Unable to identify your FantasyPros team." : "",
      },
    ]);
  }

  async function handleFantasyProsUrlImport() {
    if (fantasyProsUrl.trim() === "" || isFantasyProsImporting) {
      return;
    }

    setFantasyProsImportError("");
    setIsFantasyProsImporting(true);

    try {
      const response = await fetch("/api/fantasypros/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: fantasyProsUrl,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "FantasyPros could not import that draft.";

        setFantasyProsImportError(errorMessage);
        return;
      }

      if (!isFantasyProsDraftResponse(data)) {
        setFantasyProsImportError("FantasyPros returned an unexpected draft format.");
        return;
      }
      const sourceFileName = `fantasypros-${data.mockDraftKey.replace("nfl~", "")}.json`;
      const draftAlreadyExists = importedDrafts.some((draft) => draft.sourceFileName === sourceFileName) || pendingDrafts.some((draft) => draft.fileName === sourceFileName);
      if (draftAlreadyExists) {
        setFantasyProsImportError("This FantasyPros draft has already been imported.");
        return;
      }
      await addFantasyProsPendingDraft(data, sourceFileName);
      setFantasyProsUrl("");
    } catch {
      setFantasyProsImportError("Unable to complete the FantasyPros import. Please try again.");
    } finally {
      setIsFantasyProsImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <Image src="/landon-made-horizontal-dark.svg" alt="Landon Made" width={257} height={45} priority className="mb-8 h-auto w-52" />
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400">Fantasy Football</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Draft Analyzer 1.0</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Upload your draft results, discover your tendencies, and build a clearer picture of how you draft.</p>
        <p className="mt-3 text-sm text-slate-500">Your imported drafts are stored only in this browser.</p>
        <p id="draftUploadDescription" className="block mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Import Your Draft Results from{" "}
          <Link href="/rtsports-csv-instructions.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
            RTSports
          </Link>{" "}
          or{" "}
          <Link href="/espn-draft-export.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
            ESPN
          </Link>{" "}
          (CSV file)
        </p>
        <input ref={fileInputRef} id="resultsUpload" type="file" accept=".csv,text/csv" multiple onChange={handleFileChange} className="mt-2 block w-full max-w-md cursor-pointer rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-emerald-600 file:px-5 file:py-3 file:font-semibold file:text-white hover:file:bg-emerald-500" aria-labelledby="draftUploadDescription" />
        {isLoading && (
          <div className="relative h-16">
            <span className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-r-amber-500 border-b-amber-500 border-t-amber-500" />
          </div>
        )}
        <p className="block mt-6 max-w-2xl text-lg leading-8 text-slate-300">OR</p>
        <div className="mt-6 max-w-3xl">
          <p id="fantasyProsUrlDescription" className="block text-lg leading-8 text-slate-300">
            Import a{" "}
            <Link href="/fantasypros-import-instructions.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
              FantasyPros
            </Link>{" "}
            Mock <span className="text-red-600 font-semibold">(EXPERIMENTAL)</span>
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="fantasyProsUrl"
              type="url"
              value={fantasyProsUrl}
              onChange={(event) => {
                setFantasyProsUrl(event.target.value);
                setFantasyProsImportError("");
              }}
              placeholder="Paste FantasyPros second-screen URL"
              aria-labelledby="fantasyProsUrlDescription"
              aria-invalid={fantasyProsImportError !== ""}
              aria-describedby={fantasyProsImportError ? "fantasyProsImportError" : undefined}
              className="min-w-0 flex-1 rounded-lg bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500"
            />
            <button type="button" onClick={handleFantasyProsUrlImport} aria-disabled={fantasyProsUrl.trim() === "" || isFantasyProsImporting} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${fantasyProsUrl.trim() === "" || isFantasyProsImporting ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
              {isFantasyProsImporting ? "Importing..." : "Import draft"}
            </button>
          </div>
          {fantasyProsImportError && (
            <p id="fantasyProsImportError" role="alert" className="mt-2 text-sm text-red-300">
              {fantasyProsImportError}
            </p>
          )}
        </div>
        {pendingDrafts.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xl font-bold">Pending Imports ({pendingDrafts.length})</h2>

            <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingDrafts.map((pendingDraft) => (
                <li key={pendingDraft.id} className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800/60 p-5 shadow-sm">
                  <p className="truncate text-lg font-bold" title={pendingDraft.fileName}>
                    {pendingDraft.fileName}
                  </p>
                  {pendingDraft.importError ? <p className="mt-2 text-sm text-red-300">{pendingDraft.importError}</p> : <p className="mt-2 text-sm text-slate-400">{pendingDraft.picks.length} picks found</p>}
                  <div className="mt-3">
                    <div className="mt-auto pt-5">
                      <FilterSelect id={`pendingTeam-${pendingDraft.id}`} label={`Select your team for ${pendingDraft.fileName}`} value={pendingDraft.selectedTeam} options={createFantasyTeamOptions(pendingDraft.picks)} onChange={(event) => handlePendingTeamChange(pendingDraft.id, event)} />
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button type="button" onClick={() => handleSavePendingDraft(pendingDraft.id)} aria-disabled={pendingDraftCannotBeSaved(pendingDraft)} className={`mt-3 rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${pendingDraftCannotBeSaved(pendingDraft) ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
                          Save this draft
                        </button>
                        <button type="button" onClick={() => handleRemovePendingDraft(pendingDraft.id)} className="mt-3 cursor-pointer rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">
                          Remove from list
                        </button>
                      </div>
                    </div>
                    {importedDrafts.some((draft) => draft.sourceFileName === pendingDraft.fileName) && <p className="mt-2 text-sm text-amber-300">This draft has already been imported.</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {rankingsAreAvailable ? (
          <Link href="/rankings" className="mt-6 inline-flex gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500">
            View Draft Rankings <MoveRight />
          </Link>
        ) : (
          <span aria-disabled="true" title="Import and save a draft to view rankings" className="mt-6 inline-flex gap-2 cursor-not-allowed rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white opacity-40">
            View Draft Rankings <MoveRight />
          </span>
        )}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Imported Drafts - {importedDrafts.length}</h2>
          {importedDrafts.length > DRAFTS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4">
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
          {importedDrafts.length === 0 ? (
            <p className="mt-4 text-slate-400">No drafts have been saved yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleDrafts.map((draft) => (
                <ImportedDraftCard key={draft.id} draft={draft} onDelete={handleDeleteDraft} />
              ))}
            </div>
          )}
          {importedDrafts.length !== 0 && (
            <button type="button" onClick={() => setShowBoomConfirmation(true)} className={`mt-8 rounded-lg border-2 transition-colors duration-300 border-red-600 px-4 py-3 text-red-400 ${importedDrafts.length === 0 ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-red-500 hover:text-white"}`}>
              Delete All Drafts
            </button>
          )}
          {showBoomConfirmation && (
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
