import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import {
  TeachersManager,
  type ActiveTeacherProfile,
  type AllowedTeacherRow,
} from "@/components/admin/TeachersManager";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Docentes · Admin" };

export default async function TeachersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/");

  // Service-role para listar la whitelist (RLS no permite SELECT global).
  const admin = createAdminClient();

  const [{ data: allowedData }, { data: activeData }] = await Promise.all([
    admin
      .from("allowed_teachers")
      .select("email, note, added_at")
      .order("added_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, email, nombres, apellidos")
      .eq("role", "teacher")
      .order("apellidos", { ascending: true, nullsFirst: true }),
  ]);

  const allowed = (allowedData ?? []) as AllowedTeacherRow[];
  const active = (activeData ?? []) as ActiveTeacherProfile[];

  return (
    <AdminShell
      kicker="Docentes habilitados"
      title="Acceso del docente al dashboard"
      description="Los correos en esta lista se elevan automáticamente a rol docente al iniciar sesión. Útil para entregas a múltiples cursos o cuando el correo institucional cambia."
    >
      <TeachersManager allowed={allowed} active={active} />
    </AdminShell>
  );
}
