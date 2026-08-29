import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Draft Analyzer",
  description: "Learn how Draft Analyzer stores and uses your data.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-slate-950 px-4 py-16 text-white">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Privacy</p>

        <h1 className="mt-3 text-4xl font-bold">Privacy Policy</h1>

        <p className="mt-3 text-sm text-slate-500">Last updated August 29, 2026</p>

        <div className="mt-10 space-y-6 text-slate-300">
          <p className="leading-7">This Privacy Policy explains what information Draft Analyzer stores, why it is stored, and what choices you have when using the app.</p>

          <p className="leading-7">Draft Analyzer is designed so you can use its core CSV-import and analysis features without creating an account. Guest data stays in your browser. If you create an account, selected data is stored in the cloud so it can be accessed across devices.</p>

          <p className="leading-7">Draft Analyzer does not sell your personal information and does not use your data for advertising.</p>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Information stored in your browser</h2>

            <p className="mt-4 leading-7">When you use Draft Analyzer without an account, imported draft data and Draft Pools are saved in your browser&apos;s local storage. CSV files are processed in your browser. Draft Analyzer does not retain the original CSV file.</p>

            <p className="mt-4 leading-7">Some preferences remain browser-specific whether or not you are signed in:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7">
              <li>Player ranking adjustments and excluded players</li>
              <li>Your selected draft sorting option</li>
              <li>Your most recently selected Draft Pool on the rankings page</li>
              <li>Active Draft Tracker state for the current browser session</li>
            </ul>

            <p className="mt-4 leading-7">Browser-stored data does not automatically transfer to another browser or device. Clearing your browser storage may permanently remove it.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Information stored with an account</h2>

            <p className="mt-4 leading-7">Draft Analyzer uses Supabase to provide authentication and cloud storage. When you create an account, Supabase Auth stores your email address, account identifier, and authentication credentials. Passwords are handled by Supabase Auth and are not stored in Draft Analyzer&apos;s application tables.</p>

            <p className="mt-4 leading-7">The following Draft Analyzer data may be stored in Supabase when you are signed in:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7">
              <li>Draft Pool names and URL slugs</li>
              <li>Imported draft names, source filenames, import dates, team names, and pool assignments</li>
              <li>Draft picks, including players, positions, NFL teams, fantasy teams, and pick numbers</li>
              <li>FantasyPros draft identifiers and request times used for duplicate protection and rate limiting</li>
            </ul>

            <p className="mt-4 leading-7">Authentication cookies are used to keep you signed in. Supabase Row Level Security restricts account data so authenticated users can access only their own records through the app.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Contact form information</h2>

            <p className="mt-4 leading-7">When you use the contact form, Draft Analyzer processes the name you provide, your email address, and your message so the message can be delivered and answered.</p>

            <p className="mt-4 leading-7">To prevent contact-form abuse, Draft Analyzer stores request times and a one-way, secret-keyed identifier derived from the request&apos;s IP address. The raw IP address is not stored in Draft Analyzer&apos;s contact-rate-limit table, and the identifier is used only to enforce message limits.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">How information is used</h2>

            <p className="mt-4 leading-7">Draft Analyzer uses stored information only to operate and protect the app. This includes:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7">
              <li>Authenticating accounts and keeping users signed in</li>
              <li>Saving and synchronizing drafts and Draft Pools across devices</li>
              <li>Calculating rankings, player analysis, and Best Available results</li>
              <li>Importing permitted FantasyPros drafts and preventing duplicate or excessive requests</li>
              <li>Sending account-related emails such as email-address confirmations</li>
              <li>Diagnosing errors, preventing abuse, and maintaining the security of the app</li>
            </ul>

            <p className="mt-4 leading-7">Personalized rankings and analysis results are calculated from your draft data and settings. They are not currently stored as separate database records.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Service providers</h2>

            <p className="mt-4 leading-7">Draft Analyzer relies on a small number of outside services to operate:</p>

            <ul className="mt-4 space-y-4 leading-7">
              <li>
                <strong className="text-white">Supabase</strong> provides authentication and database storage.{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  Supabase Privacy Policy
                </a>
              </li>

              <li>
                <strong className="text-white">Resend</strong> delivers account-related emails and contact-form messages. This requires processing email addresses and email contents.{" "}
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  Resend Privacy Policy
                </a>
              </li>

              <li>
                <strong className="text-white">Cloudflare Email Routing</strong> forwards messages sent through the contact form to the project owner&apos;s email inbox.{" "}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  Cloudflare Privacy Policy
                </a>
              </li>

              <li>
                <strong className="text-white">Vercel</strong> hosts Draft Analyzer and may process technical request information such as IP addresses, browser details, and diagnostic logs while delivering the site.{" "}
                <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  Vercel Privacy Notice
                </a>
              </li>

              <li>
                <strong className="text-white">FantasyPros</strong> is contacted only when a signed-in user chooses to import a FantasyPros draft. Draft identifiers and requests needed to retrieve that draft and player information are sent to FantasyPros.{" "}
                <a href="https://www.fantasypros.com/about/privacy/" target="_blank" rel="noreferrer" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  FantasyPros Privacy Policy
                </a>
              </li>
            </ul>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Retention and deletion</h2>

            <p className="mt-4 leading-7">Guest drafts can be deleted individually or all at once from the home page. Other browser-specific data can be removed by clearing this site&apos;s browser storage.</p>

            <p className="mt-4 leading-7">Signed-in users can delete individual drafts, delete all imported drafts, or permanently delete their account from the account page. Deleting an account removes the Supabase Auth account and its associated Draft Pools, imported drafts, draft picks, and FantasyPros request history.</p>

            <p className="mt-4 leading-7">Deleting an account does not automatically clear browser-only information such as ranking overrides, excluded players, preferences, or Draft Tracker state. That information must be cleared from the browser separately.</p>

            <p className="mt-4 leading-7">Service providers may retain limited backups, security records, or diagnostic logs according to their own retention policies or legal obligations.</p>

            <p className="mt-4 leading-7">Contact-form messages may remain in the project owner&apos;s email inbox as needed to respond and maintain the correspondence. Contact-form rate-limit records are used only for abuse prevention. Records older than the active rate-limit window are ignored, and older records for a request source are removed if that source submits another request after the window expires.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Data security</h2>

            <p className="mt-4 leading-7">Draft Analyzer uses reasonable technical safeguards, including encrypted HTTPS connections, Supabase authentication, database Row Level Security, and server-only credentials for protected services.</p>

            <p className="mt-4 leading-7">No method of internet transmission or electronic storage can be guaranteed to be completely secure. You are responsible for protecting your account password and for signing out on shared devices.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Children&apos;s privacy</h2>

            <p className="mt-4 leading-7">Draft Analyzer is not directed to children under 13, and it does not knowingly collect personal information from children under 13. If you believe a child under 13 has provided personal information through the app, please use the contact form so the information can be reviewed and deleted.</p>
          </section>

          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Changes to this policy</h2>

            <p className="mt-4 leading-7">This Privacy Policy may be updated as Draft Analyzer changes. The updated date at the top of this page will be revised when material changes are made.</p>
          </section>
          <section className="pt-6">
            <h2 className="text-2xl font-bold text-white">Contact</h2>

            <p className="mt-4 leading-7">Draft Analyzer is a project by Landon Made. For privacy questions, data requests, or other concerns, use the contact form.</p>

            <Link href="/contact" className="mt-5 inline-flex rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500">
              Contact Draft Analyzer
            </Link>

            <p className="mt-4 text-sm leading-6 text-slate-400">Never send your password, API keys, or other sensitive credentials through the contact form.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
