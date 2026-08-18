import type { Position } from "@/types/draft";

const playerNameAliases: Record<string, string> = {
  "kenneth gainwell": "kenny gainwell",
  "andres borregales": "andy borregales",
  "oronde gadsden ii": "oronde gadsden",
  "patrick mahomes ii": "patrick mahomes",
  "trent sherfield sr": "trent sherfield",
  "lew nichols iii": "lew nichols",
  "matthew hibner": "matt hibner",
  "mitchell tinsley": "mitch tinsley",
  "chris godwin": "chris godwin jr",
  "kyle pitts": "kyle pitts sr",
  "james cook": "james cook iii",
  "aaron jones": "aaron jones sr",
  "travis etienne": "travis etienne jr",
  "deebo samuel": "deebo samuel sr",
  "chigoziem okonkwo": "chig okonkwo",
};

function normalizePlayerName(playerName: string): string {
  const normalizedName = playerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return playerNameAliases[normalizedName] ?? normalizedName;
}

export function createPlayerKey(playerName: string, position: Position, nflTeam: string): string {
  if (position === "DST") {
    const normalizedTeam = nflTeam.trim().toUpperCase();
    const teamKey = normalizedTeam === "JAC" ? "JAX" : normalizedTeam;

    return `dst:${teamKey.toLowerCase()}`;
  }

  return normalizePlayerName(playerName);
}
