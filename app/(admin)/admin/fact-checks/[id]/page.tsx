import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import { FactCheckEditor } from "@/components/admin/FactCheckEditor";
import { deleteFactCheck } from "../_actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Editar fact-check" };

interface FactCheckDbRow {
  id: string;
  titular_falso: string;
  contexto: string;
  fact_checker_name: string;
  fact_checker_url: string;
  candidato_relacionado: "keiko" | "roberto" | "ambos" | "ninguno" | null;
  fecha_origen: string | null;
  status: "draft" | "published" | "archived";
}

export default async function EditFactCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/login");
  const { id } = await params;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("fact_checks" as never)
    .select(
      "id, titular_falso, contexto, fact_checker_name, fact_checker_url, candidato_relacionado, fecha_origen, status",
    )
    .eq("id", id)
    .maybeSingle();
  const row = data as FactCheckDbRow | null;
  if (!row) notFound();

  async function handleDelete() {
    "use server";
    await deleteFactCheck(id);
    redirect("/admin/fact-checks");
  }

  return (
    <AdminShell
      kicker="No te dejes sorprender"
      title="Editar fact-check"
      description="Actualiza el contenido o cambia el estado. Publicado lo hace visible para los estudiantes en /no-te-dejes-sorprender."
      actions={
        <form action={handleDelete}>
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-[var(--color-coral-pulse)]/40 px-4 py-2 text-xs font-medium text-[var(--color-coral-pulse)] transition hover:bg-[var(--color-coral-pulse)] hover:text-white"
          >
            Eliminar
          </button>
        </form>
      }
    >
      <FactCheckEditor
        mode="edit"
        factCheckId={id}
        initial={{
          titularFalso: row.titular_falso,
          contexto: row.contexto,
          factCheckerName: row.fact_checker_name,
          factCheckerUrl: row.fact_checker_url,
          candidatoRelacionado: row.candidato_relacionado ?? undefined,
          fechaOrigen: row.fecha_origen ?? undefined,
          status: row.status,
        }}
      />
    </AdminShell>
  );
}
