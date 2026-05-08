"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on mount.
 * Placed in the root layout so it runs on every page.
 * Required for both PWA offline support and push notifications.
 */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[EMS SW] Registration failed:", err));
    }
  }, []);

  return null;
}
