import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supa = createClient(url, key);

  console.log("\n=== QUESTIONS pre/both activas con opciones ===");
  const { data: qs } = await supa
    .from("questions")
    .select("orden, tipo, momento, activo, opciones")
    .eq("activo", true)
    .in("momento", ["pre", "both"])
    .order("orden");
  for (const q of (qs ?? []) as Array<{ orden: number; tipo: string; momento: string; opciones: unknown }>) {
    console.log(`#${q.orden} tipo=${q.tipo} momento=${q.momento}`);
    console.log("  opciones:", JSON.stringify(q.opciones));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
