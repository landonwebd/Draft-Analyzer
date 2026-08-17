# Draft Analyzer

Draft Analyzer is a fantasy-football draft analysis app built by Landon Made. Import mock-draft results, review individual rosters, identify personal drafting tendencies, and generate a personalized average draft position (ADP) board from your draft history.

## Features

- Import multiple RTSports or ESPN draft CSV files at once
- Import FantasyPros Draft Wizard mock drafts from a shared draft-board URL
- Review, activate, and delete saved drafts
- View individual draft rosters and position breakdowns
- Filter draft data by position, fantasy team, and player name
- Generate personalized player rankings from market behavior and personal draft decisions
- Track draft frequency, average pick, meaningful passes, and Personalized ADP
- Sort and filter the rankings table
- Export personalized rankings as a CSV file
- Preserve imported drafts between browser sessions with local storage

## Supported imports

### RTSports

After completing a draft, open **Draft Settings**, then select **Download as CSV** under **Export Draft**. The app includes an illustrated RTSports download guide at `/rtsports-csv-instructions.html`.

### ESPN

ESPN drafts are exported with the included browser bookmarklet. Open `/espn-draft-export.html`, drag the exporter to the browser's bookmarks bar, then run it from a completed draft's **Pick History** page with **All Rounds** selected.

The ESPN exporter reads the structure of ESPN's draft-results page and may require an update if ESPN changes that page.

### FantasyPros (experimental)

After completing a Draft Wizard mock draft, open **Draft Board**, select **Share Draft Board**, and paste the resulting public share URL into Draft Analyzer. Illustrated instructions are available at `/fantasypros-import-instructions.html`.

This integration uses FantasyPros' public draft-board share flow and an undocumented read endpoint. It may stop working if FantasyPros changes that workflow. A FantasyPros API key is also required to translate player IDs into player information.

## Personalized ADP

Personalized ADP combines several signals from the imported drafts:

- A player's overall average draft position
- The positions where the user drafted that player
- How frequently the player appeared across drafts
- Drafts in which the player was not selected
- Meaningful passes, where the user selected a player with a later overall average pick while the passed player was still available near the user's pick

Lower Personalized ADP values indicate an earlier draft preference. The model is intended to reveal drafting tendencies rather than provide projections of NFL performance.

## Data storage and privacy

Draft data is currently stored in the browser's local storage. There is no database, account system, or cross-device synchronization in this MVP.

This means:

- Imported drafts remain available after refreshing the page
- Drafts are available only in the browser where they were imported
- Clearing browser storage removes the saved drafts
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
- React
- TypeScript
- Tailwind CSS
- Papa Parse
- Lucide icons

## Project structure

```text
src/app/          Pages and server API routes
src/components/   Reusable React components
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

## Current MVP limitations

- Drafts are stored locally and are not synchronized between devices
- There are no user accounts or database backups
- Supported CSV formats currently depend on the expected RTSports and ESPN columns
- The FantasyPros integration is experimental
- The ESPN bookmarklet depends on ESPN's current page structure
