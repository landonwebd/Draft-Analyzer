import { isFantasyProsDraftResponse } from "@/utils/isFantasyProsDraftResponse";

export async function POST(request: Request) {
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
