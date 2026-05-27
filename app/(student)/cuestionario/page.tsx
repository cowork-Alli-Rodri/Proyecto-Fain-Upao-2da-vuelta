import { redirect } from "next/navigation";

// Legacy v1 → v2: /cuestionario reroutea al resolver del flow v2 (pre o post según el estado).
export default function CuestionarioLegacyRedirect() {
  redirect("/cuestionario-pre");
}
