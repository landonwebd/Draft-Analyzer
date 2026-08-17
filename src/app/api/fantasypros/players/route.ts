export async function GET() {
  const apiKey = process.env.FANTASYPROS_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "FantasyPros API key is missing." }, { status: 500 });
  }

  const response = await fetch("https://api.fantasypros.com/public/v2/json/nfl/players", {
    headers: {
      "x-api-key": apiKey,
    },
    next: {
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    return Response.json({ error: "FantasyPros request failed." }, { status: response.status });
  }

  const data: unknown = await response.json();

  return Response.json(data);
}
