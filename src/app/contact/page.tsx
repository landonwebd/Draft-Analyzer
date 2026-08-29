import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Draft Analyzer",
  description: "Send a message to Draft Analyzer.",
};

export default function ContactPage() {
  return (
    <main className="flex-1 bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Contact</p>

        <h1 className="mt-3 text-4xl font-bold">Contact Draft Analyzer</h1>

        <p className="mt-4 max-w-xl leading-7 text-slate-300">Found a bug, have a feature idea, or need help with your data? Send a message using the form below.</p>

        <p className="mt-3 text-sm leading-6 text-slate-500">Do not include passwords, API keys, or other sensitive credentials.</p>
        <ContactForm />
      </section>
    </main>
  );
}
