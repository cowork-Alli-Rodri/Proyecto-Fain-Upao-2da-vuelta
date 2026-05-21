import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import {
  QuestionEditor,
  type QuestionDraft,
} from "@/components/admin/QuestionEditor";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import type { DimensionTematica, QuestionType } from "@/lib/validation/question.schema";

export const metadata: Metadata = { title: "Editar pregunta · Admin" };

interface DbQuestion {
  id: string;
  orden: number;
  dimension_tematica: DimensionTematica;
  tipo: QuestionType;
  enunciado: string;
  fuente: string | null;
  opciones: unknown | null;
  activo: boolean;
}

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/");

  const { data } = await supabase
    .from("questions")
    .select("id, orden, dimension_tematica, tipo, enunciado, fuente, opciones, activo")
    .eq("id", id)
    .maybeSingle();
  const q = data as DbQuestion | null;
  if (!q) notFound();

  const initial: QuestionDraft = {
    id: q.id,
    orden: q.orden,
    dimension_tematica: q.dimension_tematica,
    tipo: q.tipo,
    enunciado: q.enunciado,
    fuente: q.fuente ?? "",
    activo: q.activo,
    opciones: q.opciones,
  };

  return (
    <AdminShell
      kicker={`Editando pregunta #${q.orden}`}
      title="Modificar pregunta"
      description="Editar el enunciado o las opciones no afecta las respuestas ya capturadas: cada respuesta histórica guardó una copia del texto que el estudiante leyó."
    >
      <QuestionEditor initial={initial} mode="edit" />
    </AdminShell>
  );
}
