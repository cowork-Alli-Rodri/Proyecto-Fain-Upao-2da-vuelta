import { redirect } from "next/navigation";

// Legacy v1 → v2: /cuestionario/{step} se asume pre (lo más cercano a la intención original).
// El resolver real está en /cuestionario-pre que delega al step correcto si difiere.
export default async function CuestionarioLegacyStepRedirect({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  redirect(`/cuestionario-pre/${step}`);
}
