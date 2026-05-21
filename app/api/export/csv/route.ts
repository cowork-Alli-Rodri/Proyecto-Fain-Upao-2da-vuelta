import { downloadHeaders, guardExportRoute, isoStamp } from "../_helpers";
import { loadExportDataset } from "@/lib/export/dataset";
import { exportPreferenciasCsv, exportRespuestasCsv } from "@/lib/export/csv";

export async function GET(request: Request) {
  const guard = await guardExportRoute(request);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "preferencias";
  const ds = await loadExportDataset(guard.ctx.filters, guard.ctx.anonymize);

  const csv = view === "respuestas" ? exportRespuestasCsv(ds) : exportPreferenciasCsv(ds);
  const filename = `voto-informado-${view}-${isoStamp()}.csv`;

  return new Response(csv, {
    headers: downloadHeaders(filename, "text/csv; charset=utf-8"),
  });
}
