import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import {
  QuestionEditor,
  type QuestionDraft,
} from "@/components/admin/QuestionEditor";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { defaultOpcionesForType } from "@/lib/validation/question.schema";

export const metadata: Metadata = { title: "Nueva pregunta · Admin" };

export default async function NuevaPreguntaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/");

  const { data: maxRow } = await supabase
    .from("questions")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrden = ((maxRow as { orden?: number } | null)?.orden ?? 0) + 1;

  const initial: QuestionDraft = {
    orden: nextOrden,
    dimension_tematica: "social",
    tipo: "likert",
    enunciado: "",
    fuente: "",
    activo: true,
    opciones: defaultOpcionesForType("likert"),
  };

  return (
    <AdminShell
      kicker="Banco de preguntas · Nueva"
      title="Añadir una pregunta al cuestionario"
      description="Las preguntas creadas aquí aparecen al estudiante en el orden indicado. Mantén el lenguaje neutral; el comparador no debe sugerir voto."
    >
      <QuestionEditor initial={initial} mode="create" />
    </AdminShell>
  );
}
