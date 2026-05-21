/**
 * Integration tests del job de anonimización.
 *
 * Auto-skip si no se detecta Supabase local (sin Docker en CI). Los tres
 * casos corresponden al contracts/retention-job.md § Validación.
 */

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { anonymizeExpired } from "@/lib/retention/anonymize";
import { deleteUserData } from "@/lib/retention/delete-request";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

interface CreatedUser {
  id: string;
  email: string;
}

async function createTestStudent(
  supabase: SupabaseClient<Database>,
  suffix: string,
): Promise<CreatedUser> {
  const email = `anon-test-${suffix}-${Date.now()}@example.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "TestPassword!2026",
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");

  await supabase
    .from("profiles")
    .update({
      nombres: `Nombre-${suffix}`,
      apellidos: `Apellido-${suffix}`,
      facultad: "Ingeniería",
      carrera: "Ingeniería de Sistemas",
      ciclo: 5,
      rango_edad: "18-22",
    })
    .eq("id", data.user.id);

  return { id: data.user.id, email };
}

async function setCierre(
  supabase: SupabaseClient<Database>,
  iso: string | null,
): Promise<void> {
  await supabase.from("app_settings").update({ ciclo_cierre_at: iso }).eq("id", 1);
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

(isLocal ? describe : describe.skip)("anonymizeExpired — política de retención", () => {
  let supabase: SupabaseClient<Database>;
  const trackedUsers: CreatedUser[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterEach(async () => {
    // Best-effort cleanup: borra auth.users de los students creados.
    while (trackedUsers.length > 0) {
      const u = trackedUsers.pop()!;
      await supabase.auth.admin.deleteUser(u.id);
    }
    await setCierre(supabase, null);
  });

  it("Caso 1 — threshold no alcanzado: 0 perfiles anonimizados", async () => {
    // Ciclo cerrado hace 6 meses ⇒ threshold (cierre + 12m) aún en el futuro.
    await setCierre(supabase, monthsAgo(6));

    const u = await createTestStudent(supabase, "case1");
    trackedUsers.push(u);

    const outcome = await anonymizeExpired({ executor: "cli" });

    expect(outcome.kind).toBe("skipped");
    if (outcome.kind !== "skipped") return;
    expect(outcome.reason).toBe("threshold_not_reached");

    const { data: row } = await supabase
      .from("profiles")
      .select("nombres, is_anonymized")
      .eq("id", u.id)
      .single();
    const profile = row as { nombres: string | null; is_anonymized: boolean };
    expect(profile.is_anonymized).toBe(false);
    expect(profile.nombres).not.toBeNull();
  });

  it("Caso 2 — threshold alcanzado: anonimiza todos los perfiles pendientes", async () => {
    // Ciclo cerrado hace 13 meses ⇒ threshold ya cruzado.
    await setCierre(supabase, monthsAgo(13));

    const usersInTest: CreatedUser[] = [];
    for (let i = 0; i < 3; i++) {
      const u = await createTestStudent(supabase, `case2-${i}`);
      usersInTest.push(u);
      trackedUsers.push(u);
    }

    const outcome = await anonymizeExpired({ executor: "cli" });

    expect(outcome.kind).toBe("done");
    if (outcome.kind !== "done") return;
    // Hay perfiles previos de seed que también podrían anonimizarse: cubrimos
    // que el affected count >= cantidad de students recién creados.
    expect(outcome.affected).toBeGreaterThanOrEqual(usersInTest.length);

    for (const u of usersInTest) {
      const { data: row } = await supabase
        .from("profiles")
        .select("email, nombres, apellidos, is_anonymized")
        .eq("id", u.id)
        .single();
      const profile = row as {
        email: string | null;
        nombres: string | null;
        apellidos: string | null;
        is_anonymized: boolean;
      };
      expect(profile.is_anonymized).toBe(true);
      expect(profile.email).toBeNull();
      expect(profile.nombres).toBeNull();
      expect(profile.apellidos).toBeNull();
    }
  });

  it("Caso 3 — idempotencia: segunda ejecución no afecta a nadie", async () => {
    await setCierre(supabase, monthsAgo(13));

    const u = await createTestStudent(supabase, "case3");
    trackedUsers.push(u);

    const first = await anonymizeExpired({ executor: "cli" });
    expect(first.kind).toBe("done");

    const second = await anonymizeExpired({ executor: "cli" });
    expect(second.kind).toBe("done");
    if (second.kind !== "done") return;
    expect(second.affected).toBe(0);
  });

  it("dry-run reporta cuántos perfiles serían afectados sin escribir", async () => {
    await setCierre(supabase, monthsAgo(13));

    const u = await createTestStudent(supabase, "dryrun");
    trackedUsers.push(u);

    const outcome = await anonymizeExpired({ executor: "cli", dryRun: true });
    expect(outcome.kind).toBe("dry_run");
    if (outcome.kind !== "dry_run") return;
    expect(outcome.pending).toBeGreaterThanOrEqual(1);

    // Verifica que NO se escribió.
    const { data: row } = await supabase
      .from("profiles")
      .select("is_anonymized")
      .eq("id", u.id)
      .single();
    expect((row as { is_anonymized: boolean }).is_anonymized).toBe(false);
  });
});

(isLocal ? describe : describe.skip)("deleteUserData — self-service inmediato", () => {
  let supabase: SupabaseClient<Database>;
  const trackedUsers: CreatedUser[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterEach(async () => {
    while (trackedUsers.length > 0) {
      const u = trackedUsers.pop()!;
      await supabase.auth.admin.deleteUser(u.id);
    }
  });

  it("nullifica PII y deja idempotente al segundo request", async () => {
    const u = await createTestStudent(supabase, "delete");
    trackedUsers.push(u);

    const first = await deleteUserData(u.id);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.alreadyAnonymized).toBe(false);

    const { data: after } = await supabase
      .from("profiles")
      .select("email, nombres, apellidos, is_anonymized")
      .eq("id", u.id)
      .single();
    const profile = after as {
      email: string | null;
      nombres: string | null;
      apellidos: string | null;
      is_anonymized: boolean;
    };
    expect(profile.is_anonymized).toBe(true);
    expect(profile.email).toBeNull();
    expect(profile.nombres).toBeNull();

    const second = await deleteUserData(u.id);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.alreadyAnonymized).toBe(true);
  });
});
