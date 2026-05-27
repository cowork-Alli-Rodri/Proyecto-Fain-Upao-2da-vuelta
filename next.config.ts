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
    // CSP — defensa en profundidad contra XSS. Inline styles/scripts permitidos
    // porque Next.js + Tailwind 4 los necesita; el resto restringido a self +
    // dominios concretos (Supabase Storage, JNE imágenes, PostHog).
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.jne.gob.pe https://mpesije.jne.gob.pe",
      "font-src 'self' data:",
      // connect-src incluye Google Fact Check Tools (verificador) + ambos
      // subdominios del JNE (web.jne.gob.pe legacy + votoinformadoia.jne.gob.pe nuevo).
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.sentry.io https://*.jne.gob.pe https://factchecktools.googleapis.com",
      // frame-src incluye votoinformadoia.jne.gob.pe para embed de PDFs de
      // planes de gobierno (modal "Plan de Gobierno" en /candidatos).
      "frame-src 'self' https://challenges.cloudflare.com https://*.jne.gob.pe",
      // media-src para videos de presentación de candidatos (S3 público del JNE).
      "media-src 'self' https://jne-videos-publicos.s3.us-east-2.amazonaws.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS — forzar HTTPS por 1 año + subdominios + preload-ready.
          // Solo aplica en HTTPS real (Vercel inyecta cuando ya hay TLS).
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // CSP — defensa contra XSS. Reportar-solo en dev/preview podría
          // refinar la política antes de enforcement; por ahora enforce directo
          // porque el inline necesario está cubierto.
          { key: "Content-Security-Policy", value: cspDirectives },
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
  // Release name: si Vercel inyecta VERCEL_GIT_COMMIT_SHA lo usamos; sino se
  // autodetecta del git local.
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
  },
});
