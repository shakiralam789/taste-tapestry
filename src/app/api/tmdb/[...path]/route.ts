import { NextRequest, NextResponse } from "next/server";

const TMDB_API_BASE = "https://api.themoviedb.org/3";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathSegment = path.join("/");
  const apiKey =
    process.env.TMDB_API_KEY ||
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    process.env.VITE_TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDb API key not configured. Set TMDB_API_KEY or NEXT_PUBLIC_TMDB_API_KEY in .env" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(_request.url);
  const query = searchParams.toString();
  const url = `${TMDB_API_BASE}/${pathSegment}?api_key=${apiKey}${query ? `&${query}` : ""}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "TMDb request failed" },
      { status: 502 }
    );
  }
}
