import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Inject our push notification handlers into the generated SW
  customWorkerSrc: "src/worker",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    exclude: [/sw\.js$/],
  },
});

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(config);
