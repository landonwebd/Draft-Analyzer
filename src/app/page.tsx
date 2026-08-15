"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import FilterSelect from "@/components/FilterSelect";
import ImportedDraftCard from "@/components/ImportedDraftCard";
import type { DraftPick, ImportedDraft, Position } from "@/types/draft";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";

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

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImportTeam, setSelectedImportTeam] = useState("");
  const [importError, setImportError] = useState("");
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [importedDrafts, setImportedDrafts] = useState<ImportedDraft[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const importFantasyTeams = [...new Set(draftPicks.map((pick) => pick.fantasyTeam).filter((team): team is string => Boolean(team)))];
  const isDuplicateDraft = importedDrafts.some((draft) => draft.sourceFileName === fileName);
  const importTeamOptions = [
    { value: "", label: "Select your fantasy team" },
    ...importFantasyTeams.map((fantasyTeam) => ({
      value: fantasyTeam,
      label: fantasyTeam,
    })),
  ];

  const saveDraftIsDisabled = selectedImportTeam === "" || draftPicks.length === 0 || isDuplicateDraft;

  function handleSelectedImportTeam(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedImportTeam(event.target.value);
  }

  function handleSaveDraft() {
    if (saveDraftIsDisabled) {
      return;
    }

    if (selectedImportTeam === "" || draftPicks.length === 0 || isDuplicateDraft) {
      return;
    }

    const importedDraft: ImportedDraft = {
      id: crypto.randomUUID(),
      name: fileName.replace(/\.csv$/i, ""),
      sourceFileName: fileName,
      importedAt: new Date().toISOString(),
      myFantasyTeam: selectedImportTeam,
      picks: draftPicks,
    };

    setImportedDrafts((currentDrafts) => [...currentDrafts, importedDraft]);
    setSelectedImportTeam("");
  }

  function handleDeleteDraft(draftId: string) {
    const draftToDelete = importedDrafts.find((draft) => draft.id === draftId);
    setImportedDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId));
    if (draftToDelete?.sourceFileName === fileName) {
      clearCurrentImport();
    }
  }

  function clearCurrentImport() {
    setFileName("");
    setDraftPicks([]);
    setSelectedImportTeam("");
    setImportError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setFileName("");
      setDraftPicks([]);
      setSelectedImportTeam("");
      return;
    }

    setIsLoading(true);
    setImportError("");
    setFileName(file.name);
    setDraftPicks([]);
    setSelectedImportTeam("");

    try {
      const contents = await file.text();
      const result = Papa.parse<CsvRow>(contents, {
        header: true,
        skipEmptyLines: true,
      });
      const headers = result.meta.fields ?? [];
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
      if (missingHeaders.length > 0) {
        setImportError(`Missing required columns: ${missingHeaders.join(", ")}`);
        setDraftPicks([]);
        return;
      }
      const importedPicks = convertCsvRowsToDraftPicks(result.data);
      setDraftPicks(importedPicks);
    } finally {
      setIsLoading(false);
    }
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
        <input ref={fileInputRef} id="resultsUpload" type="file" accept=".csv,text/csv" onChange={handleFileChange} className="mt-2 py-3 px-4 block text-slate-300 rounded-md bg-slate-800 border-slate-300" name="resultsUpload" />
        {fileName && <p className="mt-3 text-sm text-slate-400">Selected file: {fileName}</p>}
        <div className="mt-8 flex flex-wrap gap-4">
          <FilterSelect id="importTeam" label="Select your fantasy team" value={selectedImportTeam} options={importTeamOptions} onChange={handleSelectedImportTeam} />

          <button type="button" onClick={handleSaveDraft} aria-disabled={saveDraftIsDisabled} className={`rounded-lg border border-slate-700 px-4 py-3 text-slate-300 ${saveDraftIsDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-800"}`}>
            Save imported draft
          </button>
        </div>
        {isLoading && (
          <div className="relative h-16">
            <span className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-r-amber-500 border-b-amber-500 border-t-amber-500" />
          </div>
        )}
        {importError && <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200">{importError}</p>}
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
