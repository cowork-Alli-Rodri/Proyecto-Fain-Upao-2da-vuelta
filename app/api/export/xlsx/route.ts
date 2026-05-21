import { downloadHeaders, guardExportRoute, isoStamp } from "../_helpers";
import { loadExportDataset } from "@/lib/export/dataset";
import { exportXlsx } from "@/lib/export/xlsx";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await guardExportRoute(request);
  if (!guard.ok) return guard.response;

  const ds = await loadExportDataset(guard.ctx.filters, guard.ctx.anonymize);
  const buffer = await exportXlsx(ds);
  const filename = `voto-informado-${isoStamp()}.xlsx`;

  // ExcelJS devuelve Buffer; Response acepta BodyInit con ArrayBuffer.
  const uint8 = new Uint8Array(buffer);
  return new Response(uint8, {
    headers: downloadHeaders(
      filename,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
  });
}
