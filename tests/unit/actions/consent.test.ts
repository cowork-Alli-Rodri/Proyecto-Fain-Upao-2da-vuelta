/**
 * Contract test — `acceptConsent` (T041).
 *
 * Verifica el contrato del server action `app/(auth)/consent/_actions.ts`:
 * - termsAccepted o dataUseAccepted false → `ConsentMissing`
 * - input vacío → `ConsentMissing`
 * - usuario no autenticado → `Unauthenticated`
 * - happy path → insert en consent_events con timestamps + ip/ua hasheados + redirect
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockSupabase, type MockSupabaseConfig } from "../helpers/supabase-mock";

const supabaseState: { config: MockSupabaseConfig; mock: ReturnType<typeof createMockSupabase> } = {
  config: { user: { id: "user-123" } },
  mock: createMockSupabase({ user: { id: "user-123" } }),
};

function resetSupabase(config: MockSupabaseConfig) {
  supabaseState.config = config;
  supabaseState.mock = createMockSupabase(config);
}

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => {
      if (name === "x-forwarded-for") return "203.0.113.5";
      if (name === "user-agent") return "vitest";
      return null;
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    const err = new Error(`NEXT_REDIRECT:${path}`);
    (err as { digest?: string }).digest = `NEXT_REDIRECT;replace;${path};307;`;
    throw err;
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabaseState.mock.client,
}));

vi.mock("@/lib/auth/turnstile", () => ({
  verifyTurnstileToken: vi.fn(async () => ({ success: true })),
}));

describe("acceptConsent (T041)", () => {
  beforeEach(() => {
    resetSupabase({
      user: { id: "user-123" },
      tables: {
        consent_events: { data: null, error: null },
        profiles: { data: { facultad: null }, error: null },
      },
    });
  });

  it("rechaza con ConsentMissing si termsAccepted no es true", async () => {
    const { acceptConsent } = await import("@/app/(auth)/consent/_actions");
    const res = await acceptConsent({
      termsAccepted: false,
      dataUseAccepted: true,
      consentVersion: "v1",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ConsentMissing");
  });

  it("rechaza con ConsentMissing si dataUseAccepted no es true", async () => {
    const { acceptConsent } = await import("@/app/(auth)/consent/_actions");
    const res = await acceptConsent({
      termsAccepted: true,
      dataUseAccepted: false,
      consentVersion: "v1",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ConsentMissing");
  });

  it("rechaza con ConsentMissing si input no trae los flags", async () => {
    const { acceptConsent } = await import("@/app/(auth)/consent/_actions");
    const res = await acceptConsent({});

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ConsentMissing");
  });

  it("rechaza con Unauthenticated si no hay sesión", async () => {
    resetSupabase({ user: null });
    const { acceptConsent } = await import("@/app/(auth)/consent/_actions");
    const res = await acceptConsent({
      termsAccepted: true,
      dataUseAccepted: true,
      consentVersion: "v1",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("Unauthenticated");
  });

  it("happy path inserta en consent_events con ambos timestamps + redirige a /profile", async () => {
    const { acceptConsent } = await import("@/app/(auth)/consent/_actions");

    await expect(
      acceptConsent({
        termsAccepted: true,
        dataUseAccepted: true,
        consentVersion: "v1",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT:\/profile/);

    const insertCall = supabaseState.mock.calls.find(
      (c) => c.table === "consent_events" && c.op === "insert",
    );
    expect(insertCall).toBeDefined();
    const payload = insertCall!.payload as {
      user_id: string;
      accepted_terms_at: string;
      accepted_data_use_at: string;
      consent_version: string;
      ip_hash: string | null;
      user_agent_hash: string | null;
    };

    expect(payload.user_id).toBe("user-123");
    expect(payload.accepted_terms_at).toBeTruthy();
    expect(payload.accepted_data_use_at).toBeTruthy();
    expect(payload.consent_version).toBe("v1");
    expect(payload.ip_hash).toBeTruthy();
    expect(payload.user_agent_hash).toBeTruthy();
  });

  it("redirige a /cuestionario si profile.facultad ya está poblada", async () => {
    resetSupabase({
      user: { id: "user-123" },
      tables: {
        consent_events: { data: null, error: null },
        profiles: { data: { facultad: "Ingeniería" }, error: null },
      },
    });

    const { acceptConsent } = await import("@/app/(auth)/consent/_actions");

    await expect(
      acceptConsent({
        termsAccepted: true,
        dataUseAccepted: true,
        consentVersion: "v1",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT:\/cuestionario/);
  });
});
