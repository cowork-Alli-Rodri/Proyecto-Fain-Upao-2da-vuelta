import { downloadHeaders, guardExportRoute, isoStamp } from "../_helpers";
import { loadExportDataset } from "@/lib/export/dataset";
import { exportPbidsManifest, exportPowerBiCsv } from "@/lib/export/powerbi";

export const runtime = "nodejs";

/**
 * Devuelve, según query param `kind`:
 *   - csv (default): el CSV plano para Power BI Desktop
 *   - pbids: el manifest .pbids que apunta al CSV (filename "voto-informado-upao.csv")
 *
 * El docente descarga ambos: pone el CSV junto al .pbids, abre el .pbids con
 * Power BI Desktop → carga directo sin transformaciones (FR-028b).
 */
export async function GET(request: Request) {
  const guard = await guardExportRoute(request);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "csv";

  if (kind === "pbids") {
    const manifest = exportPbidsManifest();
    return new Response(manifest, {
      headers: downloadHeaders(
        `voto-informado-${isoStamp()}.pbids`,
        "application/json; charset=utf-8",
      ),
    });
  }

  const ds = await loadExportDataset(guard.ctx.filters, guard.ctx.anonymize);
  const csv = exportPowerBiCsv(ds);
  return new Response(csv, {
    headers: downloadHeaders("voto-informado-upao.csv", "text/csv; charset=utf-8"),
  });
}
