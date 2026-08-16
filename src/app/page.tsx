"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import FilterSelect from "@/components/FilterSelect";
import ImportedDraftCard from "@/components/ImportedDraftCard";
import type { DraftPick, ImportedDraft, Position, PendingDraft } from "@/types/draft";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";
import { MoveRight } from "lucide-react";
import Link from "next/link";

type CsvRow = Record<string, string>;

const requiredHeaders = ["OVERALL", "PICK", "PLAYER", "POS", "TEAM"];

function isPosition(value: string): value is Position {
  return ["QB", "RB", "WR", "TE", "K", "DST"].includes(value);
}

function normalizePosition(value: string): Position | null {
  if (value === "Def/ST") {
    return "DST";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rankingsAreAvailable = hasLoadedStorage && importedDrafts.length > 0;

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
    setImportedDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId));
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
    const isDuplicate = importedDrafts.some((draft) => draft.sourceFileName === pendingDraft.fileName);
    if (pendingDraft.selectedTeam === "" || pendingDraft.picks.length === 0 || pendingDraft.importError !== "" || isDuplicate) {
      return;
    }
    const importedDraft: ImportedDraft = {
      id: crypto.randomUUID(),
      name: pendingDraft.fileName.replace(/\.csv$/i, ""),
      sourceFileName: pendingDraft.fileName,
      importedAt: new Date().toISOString(),
      myFantasyTeam: pendingDraft.selectedTeam,
      picks: pendingDraft.picks,
    };
    setImportedDrafts((currentDrafts) => [...currentDrafts, importedDraft]);
    setPendingDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== pendingDraftId));
  }

  function handleRemovePendingDraft(pendingDraftId: string) {
    setPendingDrafts((currentDrafts) => currentDrafts.filter((pendingDraft) => pendingDraft.id !== pendingDraftId));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function pendingDraftCannotBeSaved(pendingDraft: PendingDraft) {
    const isDuplicate = importedDrafts.some((draft) => draft.sourceFileName === pendingDraft.fileName);
    return pendingDraft.selectedTeam === "" || pendingDraft.picks.length === 0 || pendingDraft.importError !== "" || isDuplicate;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400">Fantasy Football</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Draft Analyzer 1.0</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Upload your draft results, discover your tendencies, and build a clearer picture of how you draft.</p>
        <label htmlFor="resultsUpload" className="block mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Import Your Draft Results
        </label>
        <input ref={fileInputRef} id="resultsUpload" type="file" accept=".csv,text/csv" multiple onChange={handleFileChange} className="mt-2 py-3 px-4 block text-slate-300 rounded-md bg-slate-800 border-slate-300" name="resultsUpload" />
        {isLoading && (
          <div className="relative h-16">
            <span className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-r-amber-500 border-b-amber-500 border-t-amber-500" />
          </div>
        )}
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
          <h2 className="text-2xl font-bold">Imported Drafts</h2>

          {importedDrafts.length === 0 ? (
            <p className="mt-4 text-slate-400">No drafts have been saved yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {importedDrafts.map((draft) => (
                <ImportedDraftCard key={draft.id} draft={draft} onDelete={handleDeleteDraft} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
