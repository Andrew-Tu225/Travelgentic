"use client";

import { useEffect, useState } from "react";
import { fetchPlacePhoto } from "@/lib/api";

export function ActivityPlaceThumbnail({ placeId, alt }) {
  const [url, setUrl] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!placeId) return;
    let active = true;
    (async () => {
      try {
        const u = await fetchPlacePhoto(placeId);
        if (active) setUrl(u);
      } catch {
        if (active) setErr(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [placeId]);

  if (err || !placeId) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0f2fe] to-[#fef3c7] text-2xl">
        📍
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1f5f9]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#FF7D54]" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob URL from API
    <img
      src={url}
      alt={alt || ""}
      className="h-20 w-20 shrink-0 rounded-xl object-cover"
    />
  );
}
