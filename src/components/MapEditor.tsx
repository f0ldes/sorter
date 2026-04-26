"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";

export type MapValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

function buildMapsQuery(v: MapValue): string | null {
  if (v.latitude != null && v.longitude != null) {
    return `${v.latitude},${v.longitude}`;
  }
  if (v.address.trim()) return v.address.trim();
  return null;
}

export function mapsViewUrl(v: MapValue): string | null {
  const q = buildMapsQuery(v);
  return q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : null;
}

export function mapsEmbedUrl(v: MapValue): string | null {
  const q = buildMapsQuery(v);
  // Keyless embed URL; for production-grade reliability, use the Maps Embed API
  // with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
  return q
    ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
    : null;
}

export function MapEditor({
  value,
  onChange,
}: {
  value: MapValue;
  onChange: (next: MapValue) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't available in this browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          ...value,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setError(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const viewUrl = mapsViewUrl(value);
  const embedUrl = mapsEmbedUrl(value);

  return (
    <div className="space-y-2">
      <input
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        placeholder="Address (e.g. 1600 Amphitheatre Pkwy, Mountain View)"
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 py-1 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          {locating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <MapPin size={12} />
          )}
          Use my location
        </button>

        {value.latitude != null && value.longitude != null && (
          <span className="text-zinc-500">
            {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            <button
              type="button"
              onClick={() =>
                onChange({ ...value, latitude: null, longitude: null })
              }
              className="ml-2 text-red-600 hover:text-red-800"
            >
              clear
            </button>
          </span>
        )}

        {viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            <ExternalLink size={12} />
            Open in Google Maps
          </a>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {embedUrl && (
        <iframe
          src={embedUrl}
          className="h-56 w-full rounded-md border border-zinc-200 dark:border-zinc-800"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Map preview"
        />
      )}
    </div>
  );
}
