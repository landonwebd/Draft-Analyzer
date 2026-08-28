"use client";

import { useImportedDrafts } from "@/hooks/useImportedDrafts";
import { useEffect, useState } from "react";
import { Bomb, X } from "lucide-react";

export default function DeleteAllDraftsControl() {
  const [showBoomConfirmation, setShowBoomConfirmation] = useState(false);
  const [deletionIsPending, setDeletionIsPending] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const { importedDrafts, importedDraftStorage, deleteAllImportedDrafts } = useImportedDrafts();

  async function handleDeleteAllDrafts() {
    setDeletionIsPending(true);
    setDeletionError("");

    try {
      const draftsWereDeleted = await deleteAllImportedDrafts();

      if (!draftsWereDeleted) {
        setDeletionError("Unable to delete your drafts. Please try again.");
        return;
      }

      setShowBoomConfirmation(false);
    } catch (error) {
      console.error("Unable to delete all drafts:", error);
      setDeletionError("Unable to delete your drafts. Please try again.");
    } finally {
      setDeletionIsPending(false);
    }
  }

  function closeBoomConfirmation() {
    if (deletionIsPending) {
      return;
    }

    setShowBoomConfirmation(false);
    setDeletionError("");
  }

  useEffect(() => {
    if (!showBoomConfirmation) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deletionIsPending) {
        setShowBoomConfirmation(false);
        setDeletionError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showBoomConfirmation, deletionIsPending]);

  return (
    <>
      {importedDrafts.length !== 0 && (
        <div className="mb-4">
          <p className="mt-2 text-sm leading-6 text-slate-400">Permanently delete all drafts associated with your account.</p>
          <button type="button" onClick={() => setShowBoomConfirmation(true)} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-800 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/60">
            <Bomb aria-hidden="true" />
            Delete All Drafts
          </button>
        </div>
      )}
      {showBoomConfirmation && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="boom-dialog-title" className="relative w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-red-950/50">
            <button type="button" onClick={closeBoomConfirmation} disabled={deletionIsPending} aria-label="Close delete all drafts confirmation" className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
              <X aria-hidden="true" />
            </button>
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-700 bg-red-950 text-red-300">
              <Bomb className="size-7" aria-hidden="true" />
            </div>
            <h3 id="boom-dialog-title" className="mt-4 text-center text-2xl font-bold">
              Delete all imported drafts?
            </h3>
            <p className="mt-3 text-center text-slate-300">
              You are about to permanently delete all <strong className="text-white">{importedDrafts.length} imported drafts</strong> {importedDraftStorage === "database" ? "from your account." : "from this browser."}
            </p>
            <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-red-400">This action cannot be undone.</p>
            {deletionError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-900/70 bg-red-950/50 px-4 py-3 text-center text-sm text-red-300">
                {deletionError}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" disabled={deletionIsPending} onClick={closeBoomConfirmation} className="cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                Never mind
              </button>
              <button type="button" onClick={handleDeleteAllDrafts} disabled={deletionIsPending} className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">
                {deletionIsPending ? "Deleting drafts..." : "BOOM! Delete everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
