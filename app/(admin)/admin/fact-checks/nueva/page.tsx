import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import { FactCheckEditor } from "@/components/admin/FactCheckEditor";
import { isAdmin } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Nuevo fact-check" };

export default async function NuevoFactCheckPage() {
  if (!(await isAdmin())) redirect("/login");

  return (
    <AdminShell
      kicker="No te dejes sorprender"
      title="Nuevo fact-check"
      description="Captura el titular falso, su contexto y la URL del fact-checker original. Solo se publica cuando lo marques como Publicado."
    >
      <FactCheckEditor mode="create" />
    </AdminShell>
  );
}
