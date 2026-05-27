"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

import { LenisProvider } from "@/components/motion/LenisProvider";

function PostHogInit() {
  useEffect(() => {
    try {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (!key || typeof window === "undefined") return;
      if (posthog.__loaded) return;

      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false,
        // Adblockers bloquean us.i.posthog.com — silenciar todos los errores
        // de red para evitar que crashee el hydration del cliente.
        on_request_error: () => {},
        loaded: () => {
          (window as typeof window & { posthog?: typeof posthog }).posthog = posthog;
        },
      });
    } catch {
      // PostHog roto no debe romper la app
    }
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
