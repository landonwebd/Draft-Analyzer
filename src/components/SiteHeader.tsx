import Image from "next/image";
import Link from "next/link";
import AccountStatus from "@/components/AccountStatus";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="Draft Analyzer home" className="inline-flex items-center">
          <Image src="/landon-made-horizontal-dark.svg" alt="Landon Made" width={257} height={45} priority className="h-auto w-40" />
        </Link>
        <AccountStatus />
      </div>
    </header>
  );
}
