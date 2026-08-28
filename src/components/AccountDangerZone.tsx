"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Bomb, X } from "lucide-react";
import { deleteAccount } from "@/app/account/actions";
import DeleteAllDraftsControl from "@/components/DeleteAllDraftsControl";

type DeleteAccountSubmitButtonProps = {
  confirmation: string;
  password: string;
};

function DeleteAccountSubmitButton({ confirmation, password }: DeleteAccountSubmitButtonProps) {
  const { pending } = useFormStatus();
  const deletionIsConfirmed = confirmation === "DELETE" && password !== "";

  return (
    <button type="submit" disabled={!deletionIsConfirmed || pending} className="cursor-pointer rounded-lg bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">
      {pending ? "Deleting account..." : "Permanently delete account"}
    </button>
  );
}

export default function AccountDangerZone() {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!dialogIsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogIsOpen(false);
        setConfirmation("");
        setPassword("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogIsOpen]);

  function closeDialog() {
    setDialogIsOpen(false);
    setConfirmation("");
    setPassword("");
  }

  return (
    <>
      <section className="mt-8 border-t border-red-950 pt-8">
        <h2 className="text-lg font-bold text-red-300">Danger Zone</h2>
        <DeleteAllDraftsControl />
        <p className="mt-2 text-sm leading-6 text-slate-400">Permanently delete your account and all drafts and Draft Pools saved to it.</p>
        <button type="button" onClick={() => setDialogIsOpen(true)} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-800 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/60">
          <Bomb aria-hidden="true" />
          Delete account
        </button>
      </section>

      {dialogIsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-account-dialog-title" className="relative w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-red-950/50">
            <button type="button" onClick={closeDialog} aria-label="Close account deletion confirmation" className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X aria-hidden="true" />
            </button>

            <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-700 bg-red-950 text-red-300">
              <Bomb className="size-7" aria-hidden="true" />
            </div>

            <h2 id="delete-account-dialog-title" className="mt-4 text-center text-2xl font-bold">
              Delete your account?
            </h2>

            <p id="delete-account-description" className="mt-3 text-center leading-6 text-slate-300">
              This permanently deletes your account, Draft Pools, imported drafts, draft picks, and FantasyPros request history.
            </p>

            <p className="mt-3 text-center text-sm text-slate-400">Browser-only data, such as ranking overrides and Draft Tracker state, remains on this device.</p>

            <form action={deleteAccount} className="mt-6">
              <label htmlFor="delete-account-password" className="block text-sm font-semibold text-slate-200">
                Current password
              </label>

              <input id="delete-account-password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mt-2 mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              <label htmlFor="delete-account-confirmation" className="block text-sm font-semibold text-slate-200">
                Type <span className="text-red-300">DELETE</span> to confirm
              </label>

              <input id="delete-account-confirmation" name="confirmation" type="text" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} required pattern="DELETE" aria-describedby="delete-account-description" className="mt-2 w-full rounded-lg border border-red-900 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={closeDialog} className="cursor-pointer rounded-lg border border-slate-600 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-800">
                  Cancel
                </button>

                <DeleteAccountSubmitButton confirmation={confirmation} password={password} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
