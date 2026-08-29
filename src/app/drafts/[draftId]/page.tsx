import DraftAnalysis from "@/components/DraftAnalysis";
import HistoryBackButton from "@/components/HistoryBackButton";

type DraftPageProps = {
  params: Promise<{
    draftId: string;
  }>;
};

export default async function DraftPage({ params }: DraftPageProps) {
  const { draftId } = await params;

  return (
    <main className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <HistoryBackButton fallbackHref="/" label="Back" />
        <DraftAnalysis draftId={draftId} />
      </div>
    </main>
  );
}
