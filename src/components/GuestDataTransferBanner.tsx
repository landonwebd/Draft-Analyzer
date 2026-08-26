"use client";

import { useState } from "react";
import { Bomb, CloudUpload } from "lucide-react";

type GuestDataTransferBannerProps = {
  guestDraftCount: number;
  guestDraftPoolCount: number;
  onDeleteGuestData: () => boolean;
  onMoveGuestData: () => Promise<boolean>;
};

export default function GuestDataTransferBanner({ guestDraftCount, guestDraftPoolCount, onDeleteGuestData, onMoveGuestData }: GuestDataTransferBannerProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState("");

  async function handleMoveGuestData() {
    setIsMoving(true);
    setMoveError("");
    const moveWasSuccessful = await onMoveGuestData();
    if (!moveWasSuccessful) {
      setMoveError("Something went wrong. Your browser data has not been removed.");
      setIsMoving(false);
      return;
    }
    setShowMoveConfirmation(false);
  }

  return (
    <section className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
      <h2 className="text-xl font-bold text-amber-200">Browser data found</h2>

      <p className="mt-2 text-sm text-amber-100/80">
        This browser contains{" "}
        <strong>
          {guestDraftCount} {guestDraftCount === 1 ? "guest draft" : "guest drafts"}
        </strong>{" "}
        and{" "}
        <strong>
          {guestDraftPoolCount} {guestDraftPoolCount === 1 ? "guest draft pool" : "guest draft pools"}
        </strong>
        .
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setMoveError("");
            setShowMoveConfirmation(true);
          }}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500"
        >
          Move browser data to account
        </button>
        <button type="button" onClick={() => setShowDeleteConfirmation(true)} className="cursor-pointer rounded-lg border border-red-500/60 px-4 py-3 font-semibold text-red-300 hover:bg-red-500 hover:text-white">
          Delete browser data
        </button>
      </div>
      {showMoveConfirmation && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="move-guest-data-title" className="w-full max-w-md rounded-2xl border border-emerald-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-emerald-700 bg-emerald-950 text-emerald-300">
              <CloudUpload className="size-7" aria-hidden="true" />
            </div>
            <h3 id="move-guest-data-title" className="mt-4 text-center text-2xl font-bold">
              Move browser data?
            </h3>
            <p className="mt-3 text-center text-slate-300">Your guest drafts and draft pools will be merged into your account. Existing account data will be kept.</p>
            <p className="mt-3 text-center text-sm text-slate-400">Drafts already in your account will be skipped. Browser copies will only be removed after the transfer succeeds.</p>
            {moveError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950/60 p-3 text-center text-sm text-red-300">
                {moveError}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={isMoving}
                onClick={() => {
                  setMoveError("");
                  setShowMoveConfirmation(false);
                }}
                className="cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Never mind
              </button>
              <button type="button" disabled={isMoving} onClick={handleMoveGuestData} className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">
                {isMoving ? "Moving data..." : "Move to my account"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-guest-data-title" className="w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-700 bg-red-950 text-red-300">
              <Bomb className="size-7" aria-hidden="true" />
            </div>
            <h3 id="delete-guest-data-title" className="mt-4 text-center text-2xl font-bold">
              Delete browser data?
            </h3>
            <p className="mt-3 text-center text-slate-300">
              Permanently delete {guestDraftCount} {guestDraftCount === 1 ? "guest draft" : "guest drafts"} and {guestDraftPoolCount} {guestDraftPoolCount === 1 ? "guest draft pool" : "guest draft pools"} from this browser? Your account data will not be affected.
            </p>
            <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-red-400">This action cannot be undone.</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setShowDeleteConfirmation(false)} className="cursor-pointer rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800">
                Never mind
              </button>
              <button type="button" onClick={onDeleteGuestData} className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-500">
                Delete browser data
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
