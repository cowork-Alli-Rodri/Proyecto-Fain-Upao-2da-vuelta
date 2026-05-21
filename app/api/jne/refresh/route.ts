import { NextResponse } from "next/server";

import { jneRefresh } from "@/lib/jne/refresh";
import { isAdmin } from "@/lib/auth/role";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint manual: dispara el refresh JNE desde la UI de admin.
 * Auth via cookie de sesión + role check.
 */
export async function POST() {
  const correlationId = logger.correlationId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  logger.info("jne-refresh admin manual started", { correlationId });
  const result = await jneRefresh({ triggeredBy: "admin" });

  if (result.ok) {
    return NextResponse.json({ status: "success", ...result.summary });
  }

  return NextResponse.json(
    {
      status: "failed",
      error: result.error,
      partial: result.partial ?? null,
    },
    { status: 502 },
  );
}
