# Draft Analyzer

Draft Analyzer is a fantasy-football draft analysis app built by Landon Made. Import mock-draft results, organize drafts by league format, identify personal drafting tendencies, and generate a personalized average draft position (ADP) board from your draft history.

Live app: [draft-analyzer-puce.vercel.app](https://draft-analyzer-puce.vercel.app/)

## Features

### Accounts and data portability

- Create an account and sign in with Supabase Auth
- Synchronize authenticated draft pools, imported drafts, and draft picks through Supabase Postgres
- Continue using the full application anonymously with browser storage
- Detect guest data after sign-in and either merge it safely into an account or delete it from the browser
- Preserve existing account drafts and pool assignments when duplicate guest drafts are skipped
- Access account data across supported browsers and devices by signing in
- Require new accounts to confirm their email address before signing in
- Permanently delete an account and its cloud-saved drafts, Draft Pools, draft picks, and import request history

### Draft importing and organization

- Import multiple RTSports or ESPN draft CSV files at once
- Import FantasyPros Draft Wizard mocks from a shared draft-board URL while signed in
- Review and save pending imports individually
- Create, rename, and delete Draft Pools for formats such as PPR, Superflex, Best Ball, or custom league groups
- Assign drafts to pools during import or from saved draft cards and individual draft pages
- Review, paginate, and delete imported drafts

### Draft analysis

- View individual rosters and position breakdowns
- Filter an individual draft by position, fantasy team, and player name
- View the best ranked players who went undrafted in a selected draft
- Follow player links between rankings, draft rosters, Best Available results, and player-detail pages
- Preserve useful browser-history navigation across draft and player pages

### Personalized rankings

- Generate Personalized ADP from market behavior and personal draft decisions
- Filter rankings by Draft Pool, position, and player name
- Sort directly from ranking-table headings
- Track draft frequency, personal average pick, overall average pick, draft rate, and meaningful passes
- Apply an appearance penalty so players with very small draft samples do not outrank players supported by substantially more draft evidence
- Calculate position ranks and dynamically generated ranking tiers
- Manually move a player up or down the board with an ADP adjustment
- Exclude unavailable or unwanted players while retaining an interface for restoring them
- Export personalized rankings, confidence data, penalties, and draft ranges as a CSV file

### Draft-day tools

- Turn on Draft Tracker Mode from the rankings page
- Cycle each player between Available, Mine, and Unavailable
- Preserve an active tracker session in browser storage
- Continue filtering and sorting while tracking a live draft

### Player analysis

- Open an individual page for any ranked player
- Review Personalized ADP, position rank, draft count, overall ADP, meaningful passes, and Ranking Confidence
- Compare the earliest and latest overall picks with the earliest and latest picks made by the user's teams
- See every imported team containing that player
- Inspect which players were selected instead during each meaningful pass
- Apply manual ADP adjustments or hide a player from rankings, tiers, exports, and Best Available
- Scope player analysis to all drafts, unassigned drafts, or a selected Draft Pool

## Supported imports

### RTSports

After completing a draft, open **Draft Settings**, then select **Download as CSV** under **Export Draft**. The app includes an illustrated RTSports download guide at `/rtsports-csv-instructions.html`.

### ESPN

ESPN drafts are exported with the included browser bookmarklet. Open `/espn-draft-export.html`, drag the exporter to the browser's bookmarks bar, then run it from a completed draft's **Pick History** page with **All Rounds** selected.

The ESPN exporter reads the structure of ESPN's draft-results page and may require an update if ESPN changes that page.

### FantasyPros (beta)

FantasyPros imports require a Draft Analyzer account. After completing a Draft Wizard mock draft, open **Draft Board**, select **Share Draft Board**, and paste the resulting public share URL into Draft Analyzer. Illustrated instructions are available at `/fantasypros-import-instructions.html`.

This integration uses FantasyPros' public draft-board share flow and an undocumented read endpoint. It may stop working if FantasyPros changes that workflow. A FantasyPros API key is also required to translate player IDs into player information. The key remains on the server and is never sent to the browser. Player metadata returned by the official FantasyPros API is cached by the server for one week.

Data provided by the [FantasyPros API](https://www.fantasypros.com/).

To protect the shared API allowance, the server enforces these per-account limits:

- No more than 5 permitted FantasyPros draft requests during a rolling 10-minute period
- No more than 25 permitted FantasyPros draft requests during a rolling 24-hour period
- No repeat request for the same mock-draft URL within one minute
- No reimporting a FantasyPros draft already saved to the account

## Personalized ADP

Personalized ADP combines several signals from the imported drafts:

- A player's overall average draft position
- The positions where the user drafted that player
- How frequently the player appeared across drafts
- Drafts in which the player was not selected
- Meaningful passes, where the user selected a player with a later overall average pick while the passed player was still available near the user's pick
- An appearance penalty of up to 12 picks for players who appear in only a small percentage of drafts
- Optional manual adjustments applied by the user

Lower Personalized ADP values indicate an earlier draft preference. The model is intended to reveal drafting tendencies rather than provide projections of NFL performance.

The appearance penalty is based on the percentage of drafts containing the player. It follows a curve so that rare players receive the largest adjustment, frequently drafted players receive very little adjustment, and players appearing in every draft receive no appearance penalty.

## Ranking Confidence

Ranking Confidence communicates how strongly the imported data supports a player's placement. The score combines the player's draft appearance rate with the number of actual appearances, preventing a player seen in two of two drafts from appearing as well established as a player seen in 70 of 70 drafts.

- **Low:** 0–29% evidence score
- **Medium:** 30–59% evidence score
- **High:** 60–100% evidence score

Ranking Confidence is informational and does not directly change Personalized ADP. The separate appearance penalty is the ranking adjustment applied to small draft samples.

Individual player pages also display overall and personal draft ranges. These show the earliest and latest overall positions where the player was selected across the active Draft Pool. Players never selected by the user's teams display **Not drafted** for the personal range.

Ranking tiers are derived from gaps between adjacent Personalized ADP values. The required gap grows as tiers progress, and large tiers receive a soft size limit so that a long cluster without a natural break remains usable on draft day. Tiers are recalculated for the currently filtered ranking list and appear only while sorting by Personalized ADP.

## Draft Pools

Draft Pools allow drafts with different scoring systems or formats to produce separate ranking contexts. A pool stores a stable internal identifier while its readable name is used in ranking and player-page URLs.

- Drafts without a pool remain **Unassigned**
- Renaming a pool preserves its draft assignments
- Deleting a pool moves its drafts back to **Unassigned**
- Rankings, player analysis, and Best Available results use only the drafts in the active pool
- Pool names must produce unique, non-reserved URL slugs

## Data storage and privacy

Draft Analyzer supports both anonymous browser storage and authenticated cloud storage.

For guests:

- Imported drafts and Draft Pools are stored in the browser's local storage
- Data remains available after refreshing but is limited to that browser and site domain
- Clearing browser storage removes locally saved data

For signed-in users:

- Draft Pools, imported drafts, and draft picks are stored in Supabase Postgres
- Supabase Row Level Security restricts each user to their own records
- Account data is available across devices after signing in
- Existing guest data can be merged into an account without overwriting matching account drafts
- Guest data remains in the browser if a transfer fails and is removed only after a successful merge

Ranking overrides, excluded players, and active Draft Tracker sessions currently remain browser-specific.

### FantasyPros API security

- Draft and player-data endpoints require an authenticated Supabase session
- Rate limits are enforced atomically in Postgres for each authenticated user
- The request-history table is stored in a private schema with Row Level Security enabled and no direct client access
- The FantasyPros API key uses a server-only environment variable without the `NEXT_PUBLIC_` prefix
- Duplicate and excessive requests are rejected before contacting FantasyPros

## Local development

### Requirements

- Node.js
- npm
- A Supabase project
- A FantasyPros API key for FantasyPros imports
- A Resend account with a verified sending domain for contact-form delivery

### Installation

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
FANTASYPROS_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=your_supabase_secret_key
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL_TO=your_contact_destination
CONTACT_RATE_LIMIT_SECRET=your_random_secret
```

Do not commit `.env.local`. Environment files are ignored by this repository. The Supabase URL and publishable key are designed for browser use; never expose a database password or Supabase service-role key through a `NEXT_PUBLIC_` variable.

`RESEND_API_KEY` authorizes server-side contact-form delivery, `CONTACT_EMAIL_TO` identifies the private destination inbox, and `CONTACT_RATE_LIMIT_SECRET` creates one-way request identifiers for abuse prevention. Keep all three values server-only. Use a long, random, project-specific value for `CONTACT_RATE_LIMIT_SECRET`.

Apply the SQL migrations in `supabase/migrations/` to the Supabase project before using account storage.

Start the development server:

```bash
npm run watch
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run watch  # Start the Next.js development server
npm run lint   # Run ESLint
npm run build  # Create and validate a production build
npm run start  # Run the production build locally
```

## Technology

- Next.js App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres with Row Level Security
- Supabase SSR
- Papa Parse
- Lucide icons
- Radix UI Slider
- Resend

## Project structure

```text
src/app/          Pages and server API routes
src/components/   Reusable React components
src/hooks/        Hybrid browser/database storage and stateful feature hooks
src/lib/supabase/ Supabase clients and database helpers
src/types/        Shared TypeScript types
src/utils/        Import, conversion, storage, and ranking utilities
supabase/          Database migrations
docs/              Database and project documentation
public/           Static instruction pages, screenshots, and the ESPN exporter
```

## Deployment

The app is designed for deployment on Vercel. Configure these project environment variables before deploying:

```text
FANTASYPROS_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
SUPABASE_SECRET_KEY
RESEND_API_KEY
CONTACT_EMAIL_TO
CONTACT_RATE_LIMIT_SECRET
```

Configure the production Site URL and allowed redirect URLs under Supabase Authentication settings. Environment-variable changes in Vercel require a new deployment.

The `SUPABASE_SECRET_KEY` bypasses Row Level Security and must remain server-only; never add a `NEXT_PUBLIC_` prefix or expose it to browser code.

Before deployment, verify the current version with:

```bash
npm run lint
npm run build
```

## Current limitations

- Guest data is browser-specific until it is moved into an account
- Ranking overrides, excluded players, and Draft Tracker progress are not yet synchronized between devices
- Supported CSV formats currently depend on the expected RTSports and ESPN columns
- FantasyPros imports are in beta, require an account, and depend on FantasyPros' current share workflow
- The ESPN bookmarklet depends on ESPN's current page structure
