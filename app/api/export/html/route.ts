import { downloadHeaders, guardExportRoute, isoStamp } from "../_helpers";
import { loadExportDataset } from "@/lib/export/dataset";
import { exportHtmlCanva } from "@/lib/export/html-canva";

export async function GET(request: Request) {
  const guard = await guardExportRoute(request);
  if (!guard.ok) return guard.response;

  const ds = await loadExportDataset(guard.ctx.filters, guard.ctx.anonymize);
  const html = exportHtmlCanva(ds);
  const filename = `voto-informado-dashboard-${isoStamp()}.html`;

  return new Response(html, {
    headers: downloadHeaders(filename, "text/html; charset=utf-8"),
  });
}
