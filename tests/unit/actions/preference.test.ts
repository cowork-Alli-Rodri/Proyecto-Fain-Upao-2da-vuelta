/**
 * Contract test — `submitPreference` (T043).
 *
 * Verifica el contrato del server action `app/(student)/preferencia/_actions.ts`:
 * - input inválido (candidato fuera de enum, confianza fuera de rango, motivo >500) → `ValidationError`
 * - usuario no autenticado → `Unauthenticated`
 * - rate limit excedido → `RateLimited`
 * - questionnaire_completed_at null → `QuestionnaireIncomplete`
 * - segundo intento (ya existe row) → `AlreadySubmitted`
 * - happy path → insert + redirect a /cierre
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockSupabase, type MockSupabaseConfig } from "../helpers/supabase-mock";

const supabaseState: { mock: ReturnType<typeof createMockSupabase> } = {
  mock: createMockSupabase({ user: { id: "stu-1" } }),
};

function resetSupabase(config: MockSupabaseConfig) {
  supabaseState.mock = createMockSupabase(config);
}

const rateLimitMock = vi.fn(async () => ({ success: true, retryAfterSec: 0 }));
const turnstileMock = vi.fn(async () => ({ success: true }));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabaseState.mock.client,
}));

vi.mock("@/lib/rate-limit/upstash", () => ({
  checkRateLimit: () => rateLimitMock(),
}));

vi.mock("@/lib/auth/turnstile", () => ({
  verifyTurnstileToken: () => turnstileMock(),
}));

const VALID_PROFILE = {
  data: {
    questionnaire_completed_at: "2026-05-22T10:00:00Z",
  },
  error: null,
};

// TODO(v2): reescribir contra el nuevo flow (verifica questionnaire_post_completed_at, no _completed_at).
describe.skip("submitPreference (T043) [v1 - pendiente refactor v2]", () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    rateLimitMock.mockResolvedValue({ success: true, retryAfterSec: 0 });
    turnstileMock.mockReset();
    turnstileMock.mockResolvedValue({ success: true });
    resetSupabase({
      user: { id: "stu-1" },
      tables: {
        profiles: VALID_PROFILE,
        preferences: { data: null, error: null },
      },
    });
  });

  it("rechaza con ValidationError si candidatoPreferido no está en el enum", async () => {
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "otro",
      confianza: 5,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ValidationError");
  });

  it("rechaza con ValidationError si confianza está fuera de 1-10", async () => {
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "keiko",
      confianza: 11,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("ValidationError");
      if (res.error.code === "ValidationError") {
        expect(res.error.field).toBe("confianza");
      }
    }
  });

  it("rechaza con ValidationError si motivo excede 500 caracteres", async () => {
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "keiko",
      confianza: 5,
      motivo: "a".repeat(501),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ValidationError");
  });

  it("rechaza con Unauthenticated si no hay sesión", async () => {
    resetSupabase({ user: null });
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "keiko",
      confianza: 5,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("Unauthenticated");
  });

  it("rechaza con RateLimited si checkRateLimit dice no", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, retryAfterSec: 30 });
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "keiko",
      confianza: 5,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("RateLimited");
  });

  it("rechaza con QuestionnaireIncomplete si questionnaire_completed_at es null", async () => {
    resetSupabase({
      user: { id: "stu-1" },
      tables: {
        profiles: {
          data: { questionnaire_completed_at: null },
        },
        preferences: { data: null, error: null },
      },
    });
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "keiko",
      confianza: 5,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("QuestionnaireIncomplete");
  });

  it("rechaza con AlreadySubmitted si ya existe una row en preferences", async () => {
    resetSupabase({
      user: { id: "stu-1" },
      tables: {
        profiles: VALID_PROFILE,
        preferences: { data: { id: "pref-1" }, error: null },
      },
    });
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");
    const res = await submitPreference({
      candidatoPreferido: "keiko",
      confianza: 5,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("AlreadySubmitted");
  });

  it("happy path inserta preferences y redirige a /cierre", async () => {
    const { submitPreference } = await import("@/app/(student)/preferencia/_actions");

    await expect(
      submitPreference({
        candidatoPreferido: "roberto",
        confianza: 8,
        motivo: "Sus propuestas en salud me convencen.",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT:\/cierre/);

    const insertCall = supabaseState.mock.calls.find(
      (c) => c.table === "preferences" && c.op === "insert",
    );
    expect(insertCall).toBeDefined();
    const payload = insertCall!.payload as {
      student_id: string;
      candidato_preferido: string;
      confianza: number;
      motivo: string;
    };
    expect(payload.student_id).toBe("stu-1");
    expect(payload.candidato_preferido).toBe("roberto");
    expect(payload.confianza).toBe(8);
    expect(payload.motivo).toBe("Sus propuestas en salud me convencen.");
  });
});
