export function createPlayerSlug(playerKey: string): string {
  return playerKey.replace(/[^a-z0-9]+/g, "-");
}
