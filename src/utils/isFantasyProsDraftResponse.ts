import type { FantasyProsDraftResponse, FantasyProsPick } from "@/types/fantasyPros";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFantasyProsPick(value: unknown): value is FantasyProsPick {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.owner === "string" && typeof value.ownerPos === "number" && typeof value.round === "number" && typeof value.pick === "number" && typeof value.isUserTeam === "boolean" && typeof value.id === "number" && typeof value.posInRound === "number" && typeof value.isKeeper === "boolean";
}

export function isFantasyProsDraftResponse(value: unknown): value is FantasyProsDraftResponse {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.mockDraftKey === "string" && typeof value.userPos === "number" && Array.isArray(value.picks) && value.picks.length > 0 && value.picks.every(isFantasyProsPick);
}
