import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Enable in all environments so PWA install prompt works in dev too
  disable: false,
  // Don't let next-pwa overwrite our custom sw.js (which handles push notifications)
  customWorkerSrc: "public/sw.js",
  // Fallback pages for offline
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // Skip waiting so new SW activates immediately
    skipWaiting: true,
    clientsClaim: true,
    // Don't precache sw.js itself
    exclude: [/sw\.js$/],
  },
});

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(config);
