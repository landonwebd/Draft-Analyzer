import DraftAnalysis from "@/components/DraftAnalysis";
import Link from "next/link";
import { MoveLeft } from "lucide-react";

type DraftPageProps = {
  params: Promise<{
    draftId: string;
  }>;
};

export default async function DraftPage({ params }: DraftPageProps) {
  const { draftId } = await params;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-flex gap-2 text-sky-400 hover:text-sky-300">
          <MoveLeft /> Back to imported drafts
        </Link>
        <DraftAnalysis draftId={draftId} />
      </div>
    </main>
  );
}
