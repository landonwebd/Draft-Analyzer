import "server-only";

import { createClient } from "@/lib/supabase/server";

const FANTASYPROS_RATE_LIMIT_RESULTS = ["allowed", "unauthorized", "invalid_mock_draft_key", "already_imported", "duplicate_request", "daily_limit", "burst_limit"] as const;

export type FantasyProsRateLimitResult = (typeof FANTASYPROS_RATE_LIMIT_RESULTS)[number];

function isFantasyProsRateLimitResult(value: unknown): value is FantasyProsRateLimitResult {
  return typeof value === "string" && FANTASYPROS_RATE_LIMIT_RESULTS.some((result) => result === value);
}

export async function checkFantasyProsRateLimit(mockDraftKey: string): Promise<FantasyProsRateLimitResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_fantasypros_import_rate_limit", {
    p_mock_draft_key: mockDraftKey,
  });

  if (error) {
    throw new Error(`Unable to check FantasyPros rate limit: ${error.message}`);
  }

  if (!isFantasyProsRateLimitResult(data)) {
    throw new Error("The FantasyPros rate limit returned an unexpected result.");
  }

  return data;
}
