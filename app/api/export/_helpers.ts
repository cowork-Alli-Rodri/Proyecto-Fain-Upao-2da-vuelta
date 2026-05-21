import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { AnonymizeMode } from "@/lib/export/dataset";
import { parseFilters, type DashboardFilters } from "@/lib/dashboard/filters";

export interface ExportContext {
  filters: DashboardFilters;
  anonymize: AnonymizeMode;
  role: "teacher" | "admin";
}

export async function guardExportRoute(
  request: Request,
): Promise<{ ok: true; ctx: ExportContext } | { ok: false; response: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== "teacher" && role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const url = new URL(request.url);
  const filters = parseFilters(url.searchParams);
  const anonRaw = url.searchParams.get("anonymize") ?? "pseudonym";
  const anonymize: AnonymizeMode =
    anonRaw === "none" && role === "admin"
      ? "none"
      : anonRaw === "full"
        ? "full"
        : "pseudonym";

  return { ok: true, ctx: { filters, anonymize, role: role as "teacher" | "admin" } };
}

export function downloadHeaders(filename: string, contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}

export function isoStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}
