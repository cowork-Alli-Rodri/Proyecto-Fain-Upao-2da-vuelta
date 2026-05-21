"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

import { LenisProvider } from "@/components/motion/LenisProvider";

function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === "undefined") return;
    if (posthog.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // explícito por evento, sin PII
    });

    // Disponible global para el wrapper sanitizador
    (window as typeof window & { posthog?: typeof posthog }).posthog = posthog;
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PostHogInit />
      <LenisProvider>{children}</LenisProvider>
    </>
  );
}
