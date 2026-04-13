"use client";

import { useState, useEffect } from "react";
import type { WeatherSnapshot } from "@/types";

export function useWeather(lat?: number, lng?: number) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;

    setLoading(true);
    setError(null);

    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setWeather(json.data);
        else setError("Weather unavailable");
      })
      .catch(() => setError("Weather unavailable"))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  return { weather, loading, error };
}
