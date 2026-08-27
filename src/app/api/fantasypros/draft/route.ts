import { isFantasyProsDraftResponse } from "@/utils/isFantasyProsDraftResponse";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";
import { checkFantasyProsRateLimit } from "@/lib/supabase/fantasyProsRateLimit";
import { retryJwtIssuedAtFuture } from "@/lib/supabase/retryJwtIssuedAtFuture";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json(
      {
        error: "Sign in to import a FantasyPros draft.",
      },
      {
        status: 401,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request body must contain valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("url" in body) || typeof body.url !== "string") {
    return Response.json({ error: "A FantasyPros URL is required." }, { status: 400 });
  }

  let draftUrl: URL;

  try {
    draftUrl = new URL(body.url);
  } catch {
    return Response.json({ error: "The FantasyPros URL is invalid." }, { status: 400 });
  }

  if (draftUrl.protocol !== "https:" || draftUrl.hostname !== "draftwizard.fantasypros.com" || draftUrl.pathname !== "/d/secondscreen.jsp") {
    return Response.json({ error: "This is not a FantasyPros second-screen URL." }, { status: 400 });
  }

  const mockDraftKey = draftUrl.searchParams.get("mockDraftKey");

  if (!mockDraftKey?.startsWith("nfl~")) {
    return Response.json({ error: "The FantasyPros mock-draft key is missing." }, { status: 400 });
  }

  try {
    const rateLimitResult = await retryJwtIssuedAtFuture(() => checkFantasyProsRateLimit(mockDraftKey));

    switch (rateLimitResult) {
      case "allowed":
        break;

      case "unauthorized":
        return Response.json(
          {
            error: "Sign in to import a FantasyPros draft.",
          },
          {
            status: 401,
          },
        );

      case "invalid_mock_draft_key":
        return Response.json(
          {
            error: "The FantasyPros mock-draft key is invalid.",
          },
          {
            status: 400,
          },
        );

      case "already_imported":
        return Response.json(
          {
            error: "This FantasyPros draft has already been imported.",
          },
          {
            status: 409,
          },
        );

      case "duplicate_request":
        return Response.json(
          {
            error: "Please wait one minute before requesting this FantasyPros draft again.",
          },
          {
            status: 429,
          },
        );

      case "burst_limit":
        return Response.json(
          {
            error: "Too many FantasyPros import attempts. Try again in a few minutes.",
          },
          {
            status: 429,
          },
        );

      case "daily_limit":
        return Response.json(
          {
            error: "You have reached today’s FantasyPros import limit. Try again later.",
          },
          {
            status: 429,
          },
        );
    }
  } catch (error) {
    console.error("Unable to check FantasyPros rate limit:", error);

    return Response.json(
      {
        error: "Unable to verify the FantasyPros import limit. Please try again.",
      },
      {
        status: 503,
      },
    );
  }

  const requestBody = new URLSearchParams({
    format: "json",
    cmd: "resumeMock",
    mockDraftKey,
  });

  try {
    const fantasyProsResponse = await fetch("https://draftwizard.fantasypros.com/spaDraft", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
      cache: "no-store",
    });
    if (!fantasyProsResponse.ok) {
      return Response.json({ error: "FantasyPros could not load that draft." }, { status: 502 });
    }
    const data: unknown = await fantasyProsResponse.json();
    if (!isFantasyProsDraftResponse(data)) {
      return Response.json({ error: "FantasyPros returned an unexpected draft format." }, { status: 502 });
    }
    return Response.json(data);
  } catch {
    return Response.json({ error: "Unable to contact FantasyPros." }, { status: 502 });
  }
}
