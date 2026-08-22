import Papa from "papaparse";
import type { DraftPick, PendingDraft, Position } from "@/types/draft";

type CsvRow = Record<string, string>;
const requiredHeaders = ["OVERALL", "PICK", "PLAYER", "POS", "TEAM"];
function isPosition(value: string): value is Position {
  return ["QB", "RB", "WR", "TE", "K", "DST"].includes(value);
}
function normalizePosition(value: string): Position | null {
  if (value === "Def/ST" || value === "D/ST") {
    return "DST";
  }
  if (value === "WRCB") {
    return "WR";
  }
  if (isPosition(value)) {
    return value;
  }
  return null;
}

function convertCsvRowsToDraftPicks(rows: CsvRow[]): DraftPick[] {
  const importedPicks: DraftPick[] = [];
  for (const row of rows) {
    const position = normalizePosition(row.POS);
    if (!position) {
      continue;
    }
    const draftPick: DraftPick = {
      overall: Number(row.OVERALL),
      pick: row.PICK,
      playerName: row.PLAYER,
      position,
      nflTeam: row.NFL,
      fantasyTeam: row.TEAM,
    };
    importedPicks.push(draftPick);
  }
  return importedPicks;
}

export async function convertFileToPendingDraft(file: File): Promise<PendingDraft> {
  const contents = await file.text();

  const result = Papa.parse<CsvRow>(contents, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  const importError = missingHeaders.length > 0 ? `Missing required columns: ${missingHeaders.join(", ")}` : "";

  const picks = importError === "" ? convertCsvRowsToDraftPicks(result.data) : [];

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    picks,
    selectedTeam: "",
    selectedPoolId: "",
    importError,
  };
}
