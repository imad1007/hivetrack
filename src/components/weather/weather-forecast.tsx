"use client";

import { useEffect, useState } from "react";
import { Wind, Droplets, AlertTriangle, CheckCircle2, CloudSun } from "lucide-react";
import type { DayForecast } from "@/app/api/weather/forecast/route";

interface Props {
  lat: number;
  lng: number;
  apiaryName?: string;
}

export function WeatherForecast({ lat, lng, apiaryName }: Props) {
  const [days, setDays] = useState<DayForecast[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/weather/forecast?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setDays(j.data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [lat, lng]);

  if (error) return null;

  const alertColors = {
    good: {
      card: "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800",
      badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
      label: "Good for bees",
    },
    fair: {
      card: "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
      label: "Fair",
    },
    poor: {
      card: "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      icon: <AlertTriangle className="h-3.5 w-3.5 text-red-600" />,
      label: "Poor",
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CloudSun className="h-4 w-4 text-amber-500" />
        7-Day Forecast
        {apiaryName && (
          <span className="text-xs font-normal text-muted-foreground">— {apiaryName}</span>
        )}
      </div>

      {!days ? (
        /* Skeleton */
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border p-3 space-y-2 animate-pulse">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
              <div className="h-4 w-12 bg-muted rounded mx-auto" />
              <div className="h-3 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map((day) => {
            const colors = alertColors[day.bee_alert];
            return (
              <div
                key={day.date}
                className={`rounded-xl border p-3 flex flex-col items-center gap-1 ${colors.card}`}
              >
                <p className="text-xs font-semibold">{day.label}</p>

                {/* Weather icon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={day.icon}
                  alt={day.condition}
                  title={day.condition}
                  className="w-10 h-10"
                />

                {/* Temperature */}
                <p className="text-sm font-bold">
                  {day.temp_max}° <span className="text-xs font-normal text-muted-foreground">/ {day.temp_min}°</span>
                </p>

                {/* Wind & rain */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Wind className="h-3 w-3" />{day.wind_kph}
                  </span>
                  {day.rain_mm > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Droplets className="h-3 w-3" />{day.rain_mm}mm
                    </span>
                  )}
                </div>

                {/* Bee alert badge */}
                <span className={`mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}>
                  {colors.icon}
                  {day.bee_alert === "good" ? "Good" : day.bee_alert === "fair" ? "Fair" : "Poor"}
                </span>

                {/* Alert reason */}
                {day.alert_reason && (
                  <p className="text-[10px] text-center text-muted-foreground leading-tight mt-0.5">
                    {day.alert_reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
