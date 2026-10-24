import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "codlek",
  project: "codlek-web",
  // Source maps go up to Sentry (for readable stack traces) only when SENTRY_AUTH_TOKEN is set on Vercel.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Browser reports go through the site itself, so ad blockers don't drop them. Kept out of src/proxy.ts.
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
