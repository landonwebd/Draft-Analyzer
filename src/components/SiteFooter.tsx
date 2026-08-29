import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
        <Link href="/" aria-label="Draft Analyzer home" className="inline-flex items-center">
          <Image src="/landon-made-horizontal-dark.svg" alt="Landon Made" width={257} height={45} className="h-auto w-40" />
        </Link>
        <div className="text-center text-xs leading-5 text-slate-500">
          <p>&copy; {new Date().getFullYear()} Landon Made</p>
          <p>
            Data provided by the{" "}
            <a href="https://www.fantasypros.com/" target="_blank" rel="noreferrer" className="text-slate-400 underline underline-offset-4 hover:text-slate-300">
              FantasyPros API
            </a>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/privacy" aria-label="Privacy Policy" className="inline-flex items-center text-sky-400 underline underline-offset-4 hover:text-sky-300">
            Privacy Policy
          </Link>
          <Link href="/contact" aria-label="Contact Landon Made" className="inline-flex items-center text-sky-400 underline underline-offset-4 hover:text-sky-300">
            Contact Landon Made
          </Link>
        </div>
      </div>
    </footer>
  );
}
