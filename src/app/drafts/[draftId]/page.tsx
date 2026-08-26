import DraftAnalysis from "@/components/DraftAnalysis";
import HistoryBackButton from "@/components/HistoryBackButton";
import SiteHeader from "@/components/SiteHeader";

type DraftPageProps = {
  params: Promise<{
    draftId: string;
  }>;
};

export default async function DraftPage({ params }: DraftPageProps) {
  const { draftId } = await params;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <HistoryBackButton fallbackHref="/" label="Back" />
          <DraftAnalysis draftId={draftId} />
        </div>
      </main>
    </>
  );
}
