"use client";

import { useState } from "react";
import type { ImportedDraft } from "@/types/draft";
import { getPositionColor } from "@/utils/positionStyles";
import { Play } from "lucide-react";
import Link from "next/link";

type ImportedDraftCardProps = {
  draft: ImportedDraft;
  onDelete: (draftId: string) => void;
};

export default function ImportedDraftCard({ draft, onDelete }: ImportedDraftCardProps) {
  const [showFullRoster, setShowFullRoster] = useState(false);
  const myRoster = draft.picks.filter((pick) => pick.fantasyTeam === draft.myFantasyTeam);
  const playersToDisplay = showFullRoster ? myRoster : myRoster.slice(0, 3);
  const hiddenPlayerCount = Math.max(myRoster.length - 3, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/Chicago",
  });
  const dateObject = new Date(draft.importedAt);
  const hasValidImportDate = !Number.isNaN(dateObject.getTime());
  const prettyTime = hasValidImportDate ? formatter.format(dateObject) : "Import date unavailable";

  function handleToggleRoster() {
    setShowFullRoster((currentValue) => !currentValue);
  }

  function handleDelete() {
    const shouldDelete = window.confirm(`Delete "${draft.name}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }
    onDelete(draft.id);
  }

  return (
    <article className="flex flex-col rounded-xl border-2 border-slate-800 bg-slate-900 p-5">
      <div className="flex justify-between gap-5">
        <h2 className="text-xl font-bold">{draft.name}</h2>
        <Link href={`/drafts/${draft.id}`} aria-label={`View analysis for ${draft.name}`} title={`View analysis for ${draft.name}`} className="grid size-10 place-items-center rounded-full border-2 border-slate-300 hover:border-sky-400 hover:text-sky-400">
          <Play className="size-5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-2 text-slate-300">{draft.myFantasyTeam}</p>
      {hasValidImportDate ? (
        <p className="mt-2 text-sm text-slate-400">
          Imported on <time dateTime={draft.importedAt}>{prettyTime}</time>
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Import date unavailable</p>
      )}
      <p className="text-sm text-slate-400">Roster Size: {myRoster.length} players</p>
      <div className="flex flex-col h-full justify-between">
        {myRoster.length === 0 ? (
          <p className="mt-5 text-sm text-slate-400">No players found for this fantasy team.</p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-800" data-component="players-list">
            {playersToDisplay.map((player) => (
              <li className="grid grid-cols-[minmax(0,1fr)_3rem_4.5rem] items-center gap-4 py-1" key={player.overall}>
                <span className="truncate font-medium">{player.playerName}</span>
                <span className={`w-full justify-self-center text-center rounded-md ${getPositionColor(player.position)} px-2 py-1 text-xs font-bold text-slate-300`}>{player.position}</span>
                <span className="text-right text-sm tabular-nums text-slate-400">Pick {player.pick}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-4 mt-5">
          {hiddenPlayerCount > 0 && (
            <button type="button" onClick={handleToggleRoster} className="cursor-pointer rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">
              {showFullRoster ? "Show fewer players" : `Show ${hiddenPlayerCount} more players`}
            </button>
          )}
          <button type="button" onClick={handleDelete} className="cursor-pointer rounded-lg border border-red-900 px-4 py-3 text-red-300 hover:bg-red-950">
            Delete draft
          </button>
        </div>
      </div>
    </article>
  );
}
