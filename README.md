# Draft Analyzer

Draft Analyzer is a fantasy-football draft analysis app built by Landon Made. Import mock-draft results, organize drafts by league format, identify personal drafting tendencies, and generate a personalized average draft position (ADP) board from your draft history.

Live app: [draft-analyzer-puce.vercel.app](https://draft-analyzer-puce.vercel.app/)

## Features

### Draft importing and organization

- Import multiple RTSports or ESPN draft CSV files at once
- Import FantasyPros Draft Wizard mocks from a shared draft-board URL
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

### FantasyPros (experimental)

After completing a Draft Wizard mock draft, open **Draft Board**, select **Share Draft Board**, and paste the resulting public share URL into Draft Analyzer. Illustrated instructions are available at `/fantasypros-import-instructions.html`.

This integration uses FantasyPros' public draft-board share flow and an undocumented read endpoint. It may stop working if FantasyPros changes that workflow. A FantasyPros API key is also required to translate player IDs into player information. Player metadata returned by the official FantasyPros API is cached by the server for one week.

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

Application data is currently stored in the browser's local storage. There is no database, account system, or cross-device synchronization.

This means:

- Imported drafts remain available after refreshing the page
- Draft Pools, ranking overrides, excluded players, and an active Draft Tracker session also persist locally
- Drafts are available only in the browser where they were imported
- Clearing browser storage removes saved application data
- Deploying a new version of the app does not automatically move local data between domains or devices

## Local development

### Requirements

- Node.js
- npm
- A FantasyPros API key for FantasyPros imports

### Installation

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
FANTASYPROS_API_KEY=your_api_key_here
```

Do not commit `.env.local`. Environment files are ignored by this repository.

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
- Papa Parse
- Lucide icons
- Radix UI Slider

## Project structure

```text
src/app/          Pages and server API routes
src/components/   Reusable React components
src/hooks/        Browser-storage and stateful feature hooks
src/types/        Shared TypeScript types
src/utils/        Import, conversion, storage, and ranking utilities
public/           Static instruction pages, screenshots, and the ESPN exporter
```

## Deployment

The app is designed for deployment on Vercel. Add `FANTASYPROS_API_KEY` to the project's Vercel environment variables before deploying if FantasyPros imports will remain enabled.

Before deployment, verify the current version with:

```bash
npm run lint
npm run build
```

## Current limitations

- Drafts are stored locally and are not synchronized between devices
- There are no user accounts or database backups
- Supported CSV formats currently depend on the expected RTSports and ESPN columns
- The FantasyPros integration is experimental
- The ESPN bookmarklet depends on ESPN's current page structure
- Draft Pools and ranking overrides are also local to one browser
