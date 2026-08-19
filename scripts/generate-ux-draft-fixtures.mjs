import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DRAFT_COUNT = 20;
const sourcePath = process.argv[2];
const jsonOutputPath = new URL("../public/ux-sample-drafts.json", import.meta.url);
const zipOutputPath = new URL("../public/ux-large-draft-test-set.zip", import.meta.url);

if (!sourcePath) {
  throw new Error("Provide the path to a Draft Analyzer JSON export.");
}

function escapeCsvValue(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function selectEvenlySpacedDrafts(drafts) {
  if (drafts.length < DRAFT_COUNT) {
    throw new Error(`The export must contain at least ${DRAFT_COUNT} drafts.`);
  }

  return Array.from({ length: DRAFT_COUNT }, (_, index) => {
    const sourceIndex = Math.round((index * (drafts.length - 1)) / (DRAFT_COUNT - 1));
    return drafts[sourceIndex];
  });
}

function createAnonymousTeamNames(draft) {
  const teamNames = new Map([[draft.myFantasyTeam, "UX Tester Team"]]);
  let nextTeamNumber = 1;

  for (const pick of draft.picks) {
    if (teamNames.has(pick.fantasyTeam)) {
      continue;
    }

    teamNames.set(pick.fantasyTeam, `Sample Team ${String(nextTeamNumber).padStart(2, "0")}`);
    nextTeamNumber += 1;
  }

  return teamNames;
}

const sourceDrafts = JSON.parse(readFileSync(sourcePath, "utf8"));

if (!Array.isArray(sourceDrafts)) {
  throw new Error("The Draft Analyzer export must contain an array of drafts.");
}

const selectedDrafts = selectEvenlySpacedDrafts(sourceDrafts);
const fixtureDrafts = [];
const temporaryDirectory = mkdtempSync(join(tmpdir(), "draft-analyzer-ux-fixtures-"));

try {
  for (let index = 0; index < selectedDrafts.length; index += 1) {
    const sourceDraft = selectedDrafts[index];
    const draftNumber = index + 1;
    const numberLabel = String(draftNumber).padStart(2, "0");
    const fileName = `ux-test-draft-${numberLabel}.csv`;
    const anonymousTeamNames = createAnonymousTeamNames(sourceDraft);
    const picks = sourceDraft.picks.map((pick) => ({
      overall: pick.overall,
      pick: pick.pick,
      playerName: pick.playerName,
      position: pick.position,
      nflTeam: pick.nflTeam,
      fantasyTeam: anonymousTeamNames.get(pick.fantasyTeam),
    }));

    const csvRows = [
      "OVERALL,PICK,PLAYER,NFL,POS,TEAM,OWNER",
      ...picks.map((pick) => {
        const ownerName = pick.fantasyTeam === "UX Tester Team" ? "UX Tester" : pick.fantasyTeam.replace("Team", "Owner");
        const csvPosition = pick.position === "DST" ? "Def/ST" : pick.position;
        return [pick.overall, pick.pick, pick.playerName, pick.nflTeam, csvPosition, pick.fantasyTeam, ownerName].map(escapeCsvValue).join(",");
      }),
    ];

    writeFileSync(join(temporaryDirectory, fileName), `${csvRows.join("\n")}\n`);

    fixtureDrafts.push({
      id: `ux-sample-draft-${numberLabel}`,
      name: `UX Test League ${numberLabel}`,
      sourceFileName: fileName,
      importedAt: new Date(Date.UTC(2026, 7, draftNumber, 12, 0, 0)).toISOString(),
      myFantasyTeam: "UX Tester Team",
      picks,
    });
  }

  writeFileSync(jsonOutputPath, `${JSON.stringify(fixtureDrafts, null, 2)}\n`);
  rmSync(zipOutputPath, { force: true });
  execFileSync("zip", ["-q", "-j", fileURLToPath(zipOutputPath), ...Array.from({ length: DRAFT_COUNT }, (_, index) => join(temporaryDirectory, `ux-test-draft-${String(index + 1).padStart(2, "0")}.csv`))]);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Generated ${DRAFT_COUNT} anonymized UX draft fixtures from real draft data.`);
