import type { Metadata } from "next";
import OverallDraftAnalysis from "@/components/OverallDraftAnalysis";

export const metadata: Metadata = {
  title: "Overall Draft Analysis | Draft Analyzer",
  description: "Explore patterns and tendencies across your imported fantasy football drafts.",
};

export default function AnalysisPage() {
  return (
    <main className="flex-1 bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <h1 className="text-4xl font-bold">Overall Draft Analysis</h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-300">See what your draft history reveals about your draft slots, roster construction, player exposure, and more.</p>
        <OverallDraftAnalysis />
      </section>
    </main>
  );
}
