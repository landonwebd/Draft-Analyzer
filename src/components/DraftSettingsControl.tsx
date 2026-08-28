"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { Settings, X } from "lucide-react";

type DraftSettingsControlProps = {
  draftName: string;
  onRename: (nextName: string) => Promise<boolean>;
};

export default function DraftSettingsControl({ draftName, onRename }: DraftSettingsControlProps) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [nextName, setNextName] = useState(draftName);
  const [renameIsPending, setRenameIsPending] = useState(false);
  const [renameError, setRenameError] = useState("");

  function openDialog() {
    setNextName(draftName);
    setRenameError("");
    setDialogIsOpen(true);
  }

  function closeDialog() {
    setDialogIsOpen(false);
    setNextName(draftName);
    setRenameError("");
  }

  useEffect(() => {
    if (!dialogIsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogIsOpen(false);
        setNextName(draftName);
        setRenameError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogIsOpen, draftName]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = nextName.trim();

    if (trimmedName === "") {
      setRenameError("Enter a name for this draft.");
      return;
    }

    if (trimmedName === draftName) {
      closeDialog();
      return;
    }

    setRenameIsPending(true);
    setRenameError("");

    const renameSucceeded = await onRename(trimmedName);

    setRenameIsPending(false);

    if (!renameSucceeded) {
      setRenameError("Unable to rename this draft. Please try again.");
      return;
    }

    setDialogIsOpen(false);
  }

  return (
    <>
      <button type="button" onClick={openDialog} aria-label={`Settings for ${draftName}`} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white">
        <Settings className="size-4" aria-hidden="true" />
        Settings
      </button>

      {dialogIsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="draft-settings-dialog-title" className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <button type="button" onClick={closeDialog} aria-label="Close draft settings" className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X aria-hidden="true" />
            </button>

            <div className="grid size-12 place-items-center rounded-full border border-sky-800 bg-sky-950 text-sky-300">
              <Settings aria-hidden="true" />
            </div>

            <h2 id="draft-settings-dialog-title" className="mt-4 text-2xl font-bold">
              Draft settings
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">Change the name used to identify this imported draft.</p>

            <form onSubmit={handleSubmit} className="mt-6">
              <label htmlFor="draft-name" className="block text-sm font-semibold text-slate-200">
                Draft name
              </label>

              <input id="draft-name" type="text" value={nextName} onChange={(event) => setNextName(event.target.value)} disabled={renameIsPending} autoFocus className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60" />

              {renameError && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {renameError}
                </p>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={closeDialog} disabled={renameIsPending} className="cursor-pointer rounded-lg border border-slate-600 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  Cancel
                </button>

                <button type="submit" disabled={renameIsPending || nextName.trim() === ""} className="cursor-pointer rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50">
                  {renameIsPending ? "Saving..." : "Save name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
