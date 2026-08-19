export async function GET() {
  const apiKey = process.env.FANTASYPROS_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "FantasyPros API key is missing." }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.fantasypros.com/public/v2/json/nfl/players", {
      headers: {
        "x-api-key": apiKey,
      },
      next: {
        revalidate: 604800,
      },
    });

    if (!response.ok) {
      return Response.json({ error: "FantasyPros request failed." }, { status: response.status });
    }

    const data: unknown = await response.json();

    return Response.json(data);
  } catch {
    return Response.json({ error: "Unable to contact FantasyPros for player data." }, { status: 502 });
  }
}
