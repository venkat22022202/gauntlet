"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires a lightweight beacon on each page view so we can count real
 * (JS-executing) visitors. Non-blocking; failures are ignored.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const payload = JSON.stringify({
        path: pathname || "/",
        ref: document.referrer || undefined,
      });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
