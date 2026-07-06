import { NextRequest, NextResponse } from "next/server";

export interface DayForecast {
  label: string;        // "Today", "Tomorrow", "Wed"
  date: string;         // ISO date string
  icon: string;         // openweathermap icon URL
  condition: string;
  temp_min: number;
  temp_max: number;
  wind_kph: number;
  rain_mm: number;
  bee_alert: "good" | "fair" | "poor"; // good: all green, fair: one concern, poor: stay home
  alert_reason: string | null;
}

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
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&cnt=56&appid=${apiKey}`,
    { next: { revalidate: 1800 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
  }

  const raw = await res.json();
  const items: {
    dt: number;
    main: { temp_min: number; temp_max: number; temp: number };
    weather: { description: string; icon: string }[];
    wind: { speed: number };
    rain?: { "3h"?: number };
  }[] = raw.list ?? [];

  // Group 3-hour entries by local date
  const byDay: Record<string, typeof items> = {};
  for (const item of items) {
    const day = new Date(item.dt * 1000).toISOString().split("T")[0];
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  }

  const today = new Date().toISOString().split("T")[0];
  const days = Object.keys(byDay)
    .sort()
    .filter((d) => d >= today)
    .slice(0, 7);

  const forecasts: DayForecast[] = days.map((day, idx) => {
    const entries = byDay[day];
    const temps = entries.map((e) => e.main.temp);
    const temp_min = Math.round(Math.min(...entries.map((e) => e.main.temp_min ?? e.main.temp)));
    const temp_max = Math.round(Math.max(...entries.map((e) => e.main.temp_max ?? e.main.temp)));
    const wind_kph = Math.round(Math.max(...entries.map((e) => e.wind.speed)) * 3.6);
    const rain_mm = parseFloat(
      entries.reduce((sum, e) => sum + (e.rain?.["3h"] ?? 0), 0).toFixed(1)
    );
    // Pick the representative icon (midday entry preferred)
    const rep = entries.find((e) => {
      const h = new Date(e.dt * 1000).getUTCHours();
      return h >= 10 && h <= 14;
    }) ?? entries[Math.floor(entries.length / 2)];

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    // Bee-flight suitability heuristics
    let alert_reason: string | null = null;
    if (wind_kph >= 40) {
      alert_reason = `High wind (${wind_kph} km/h) — bees grounded`;
    } else if (rain_mm >= 10) {
      alert_reason = `Heavy rain (${rain_mm} mm) — inspect indoors only`;
    } else if (temp_max < 12) {
      alert_reason = `Cold (max ${temp_max}°C) — limited foraging`;
    } else if (temp_max >= 38) {
      alert_reason = `Extreme heat (${temp_max}°C) — risk of comb melting`;
    } else if (wind_kph >= 25) {
      alert_reason = `Windy (${wind_kph} km/h) — reduced foraging`;
    } else if (rain_mm >= 3) {
      alert_reason = `Rain expected (${rain_mm} mm)`;
    }

    const bee_alert =
      !alert_reason
        ? "good"
        : wind_kph >= 40 || rain_mm >= 10 || temp_max < 12 || temp_max >= 38
        ? "poor"
        : "fair";

    const label =
      idx === 0 ? "Today" : idx === 1 ? "Tomorrow"
      : new Date(day + "T12:00:00Z").toLocaleDateString("en", { weekday: "short" });

    return {
      label,
      date: day,
      icon: `https://openweathermap.org/img/wn/${rep.weather[0].icon}@2x.png`,
      condition: rep.weather[0].description,
      temp_min,
      temp_max,
      wind_kph,
      rain_mm,
      bee_alert,
      alert_reason,
    };
  });

  return NextResponse.json({ data: forecasts });
}
