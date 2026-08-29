import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const CONTACT_RATE_LIMIT_RESULTS = ["allowed", "invalid_request_hash", "daily_limit", "burst_limit"] as const;

export type ContactRateLimitResult = (typeof CONTACT_RATE_LIMIT_RESULTS)[number];

function isContactRateLimitResult(value: unknown): value is ContactRateLimitResult {
  return typeof value === "string" && CONTACT_RATE_LIMIT_RESULTS.some((result) => result === value);
}

export async function checkContactRateLimit(requestHash: string): Promise<ContactRateLimitResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("check_contact_form_rate_limit", {
    p_request_hash: requestHash,
  });

  if (error) {
    throw new Error(`Unable to check contact-form rate limit: ${error.message}`);
  }

  if (!isContactRateLimitResult(data)) {
    throw new Error("The contact-form rate limit returned an unexpected result.");
  }

  return data;
}
