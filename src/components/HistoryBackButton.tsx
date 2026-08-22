"use client";

import { useRouter } from "next/navigation";
import { MoveLeft } from "lucide-react";

type HistoryBackButtonProps = {
  fallbackHref: string;
  label: string;
};

export default function HistoryBackButton({ fallbackHref, label }: HistoryBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }
  return (
    <button type="button" onClick={handleBack} className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sky-400 hover:text-sky-300">
      <MoveLeft aria-hidden="true" />
      {label}
    </button>
  );
}
