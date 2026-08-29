"use client";

import { useState } from "react";
import Link from "next/link";
import type { PendingDraft } from "@/types/draft";
import type { FantasyProsDraftResponse } from "@/types/fantasyPros";
import { buildFantasyProsPlayerLookup } from "@/utils/buildFantasyProsPlayerLookup";
import { convertFantasyProsDraft } from "@/utils/convertFantasyProsDraft";
import { getFantasyProsPlayers } from "@/utils/getFantasyProsPlayers";
import { isFantasyProsDraftResponse } from "@/utils/isFantasyProsDraftResponse";

type FantasyProsImportProps = {
  storage: "guest" | "database" | null;
  existingSourceFileNames: string[];
  onAddPendingDraft: (draft: PendingDraft) => void;
};

export default function FantasyProsImport({ storage, existingSourceFileNames, onAddPendingDraft }: FantasyProsImportProps) {
  const [fantasyProsUrl, setFantasyProsUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  async function createPendingDraft(draftResponse: FantasyProsDraftResponse, sourceFileName: string) {
    const playersResponse = await getFantasyProsPlayers();
    const playerLookup = buildFantasyProsPlayerLookup(playersResponse.players);
    const convertedPicks = convertFantasyProsDraft(draftResponse, playerLookup);

    const userPick = draftResponse.picks.find((pick) => pick.isUserTeam);
    const selectedTeam = userPick?.owner ?? "";

    setFantasyProsUrl("");

    onAddPendingDraft({
      id: crypto.randomUUID(),
      fileName: sourceFileName,
      picks: convertedPicks,
      selectedTeam,
      selectedPoolId: "",
      importError: selectedTeam === "" ? "Unable to identify your FantasyPros team." : "",
    });
  }

  async function handleImport() {
    if (storage !== "database" || fantasyProsUrl.trim() === "" || isImporting) {
      return;
    }

    setImportError("");
    setIsImporting(true);

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

        setImportError(errorMessage);
        return;
      }

      if (!isFantasyProsDraftResponse(data)) {
        setImportError("FantasyPros returned an unexpected draft format.");
        return;
      }

      const sourceFileName = `fantasypros-${data.mockDraftKey.replace("nfl~", "")}.json`;

      if (existingSourceFileNames.includes(sourceFileName)) {
        setImportError("This FantasyPros draft has already been imported.");
        return;
      }

      await createPendingDraft(data, sourceFileName);
    } catch {
      setImportError("Unable to complete the FantasyPros import. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
      <h3 id="fantasyProsUrlDescription" className="text-lg font-bold text-white">
        FantasyPros Mock <span className="text-sm font-semibold text-red-400">(BETA)</span>
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Import a completed mock using its{" "}
        <Link href="/fantasypros-import-instructions.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
          FantasyPros second-screen URL
        </Link>
        .
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Data provided by the{" "}
        <Link href="https://www.fantasypros.com/" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300">
          FantasyPros API
        </Link>
        .
      </p>
      {storage === null ? (
        <p className="mt-3 text-sm text-slate-500">Checking your account…</p>
      ) : storage === "guest" ? (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-sm leading-6 text-slate-300">FantasyPros imports are available to signed-in users. CSV imports remain available without an account.</p>

          <Link href="/login" className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">
            Sign in to import
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="fantasyProsUrl"
              type="url"
              value={fantasyProsUrl}
              onChange={(event) => {
                setFantasyProsUrl(event.target.value);
                setImportError("");
              }}
              placeholder="Paste FantasyPros URL"
              aria-labelledby="fantasyProsUrlDescription"
              aria-invalid={importError !== ""}
              aria-describedby={importError ? "fantasyProsImportError" : undefined}
              className="min-w-0 flex-1 rounded-lg bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500"
            />

            <button type="button" disabled={fantasyProsUrl.trim() === "" || isImporting} onClick={handleImport} className="cursor-pointer rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
              {isImporting ? "Importing..." : "Import draft"}
            </button>
          </div>

          {importError && (
            <p id="fantasyProsImportError" role="alert" className="mt-2 text-sm text-red-300">
              {importError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
