import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes salió de experimental en Next 16.2. Se rehabilita más adelante
  // (Phase 7) cuando todas las rutas tipadas estén estables; mientras tanto los
  // redirects usan strings.
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "mpesije.jne.gob.pe",
        pathname: "/docs/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// Wrap con Sentry para upload automático de source maps y release tracking.
// Solo actúa si `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y `SENTRY_PROJECT` están en el
// entorno (Vercel + CI). En dev local sin estas envs, el wrapper es no-op y la
// build continúa normal — no rompe la DX.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  disableLogger: true,
  // Release name: si Vercel inyecta VERCEL_GIT_COMMIT_SHA lo usamos; sino se
  // autodetecta del git local.
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
  },
});
