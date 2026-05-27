import { redirect } from "next/navigation";

// Legacy v1 → v2: /cuestionario reroutea al resolver del flow v2 (pre o post según el estado).
// force-dynamic: sin esto Vercel prerenderiza el redirect en build time y lo sirve
// cacheado a Server Actions que apuntan aquí, mezclando headers PRERENDER con
// los headers RSC esperados → cliente recibe "An unexpected response" (E394).
export const dynamic = "force-dynamic";

export default function CuestionarioLegacyRedirect() {
  redirect("/cuestionario-pre");
}
