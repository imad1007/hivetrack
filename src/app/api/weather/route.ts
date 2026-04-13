import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Weather API not configured" }, { status: 503 });
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`,
    { next: { revalidate: 1800 } } // cache 30 minutes
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
  }

  const raw = await res.json();

  return NextResponse.json({
    data: {
      temp_c: Math.round(raw.main?.temp ?? 0),
      wind_kph: Math.round((raw.wind?.speed ?? 0) * 3.6),
      humidity: raw.main?.humidity ?? 0,
      condition: raw.weather?.[0]?.description ?? "unknown",
      icon: raw.weather?.[0]?.icon
        ? `https://openweathermap.org/img/wn/${raw.weather[0].icon}@2x.png`
        : null,
    },
  });
}
