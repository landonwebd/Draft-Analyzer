"use client";

import { type SubmitEvent, useState } from "react";

export default function ContactForm() {
  const [submissionIsPending, setSubmissionIsPending] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submissionSucceeded, setSubmissionSucceeded] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmissionIsPending(true);
    setSubmissionMessage("");
    setSubmissionSucceeded(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          message: String(formData.get("message") ?? ""),
          company: String(formData.get("company") ?? ""),
        }),
      });

      const responseBody: unknown = await response.json();

      if (typeof responseBody !== "object" || responseBody === null) {
        throw new Error("The contact endpoint returned an invalid response.");
      }

      if (!response.ok) {
        const errorMessage = "error" in responseBody && typeof responseBody.error === "string" ? responseBody.error : "Unable to send your message. Please try again.";

        setSubmissionMessage(errorMessage);
        return;
      }

      const successMessage = "message" in responseBody && typeof responseBody.message === "string" ? responseBody.message : "Thanks! Your message has been sent.";

      form.reset();
      setSubmissionSucceeded(true);
      setSubmissionMessage(successMessage);
    } catch (error) {
      console.error("Unable to submit contact form:", error);
      setSubmissionMessage("Unable to send your message. Please try again.");
    } finally {
      setSubmissionIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submissionIsPending} className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
      <fieldset disabled={submissionIsPending}>
        <div>
          <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-200">
            Name <span className="font-normal text-slate-500">(optional)</span>
          </label>

          <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={100} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <div className="mt-5">
          <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-200">
            Email address
          </label>

          <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <div className="mt-5">
          <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-200">
            Message
          </label>

          <textarea id="contact-message" name="message" rows={8} minLength={10} maxLength={5000} required className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="contact-company">Company</label>
          <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="mt-6 w-full cursor-pointer rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
          {submissionIsPending ? "Sending message..." : "Send message"}
        </button>
      </fieldset>
      {submissionMessage && (
        <p role={submissionSucceeded ? "status" : "alert"} className={`mt-5 rounded-lg border px-4 py-3 text-sm ${submissionSucceeded ? "border-emerald-900/70 bg-emerald-950/50 text-emerald-300" : "border-red-900/70 bg-red-950/50 text-red-300"}`}>
          {submissionMessage}
        </p>
      )}
    </form>
  );
}
