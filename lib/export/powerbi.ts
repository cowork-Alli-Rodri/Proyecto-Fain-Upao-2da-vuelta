import type { ExportDataset } from "./dataset";

/**
 * Genera dataset Power BI: un único CSV plano con todas las dimensiones de cada
 * estudiante en columnas para que Power BI Desktop lo importe sin
 * transformaciones (FR-028b).
 *
 * Una fila por preferencia (estudiantes sin preferencia se omiten para
 * mantener el dataset analítico). El docente puede pedir CSV simple si
 * necesita todos los inscritos.
 */
export function exportPowerBiCsv(ds: ExportDataset): string {
  const headers = [
    "student_pseudo",
    "facultad",
    "carrera",
    "ciclo",
    "rango_edad",
    "genero",
    "questionnaire_completed_at",
    "compare_order_at_submit",
    "candidato_preferido",
    "confianza",
    "motivo",
    "submitted_at",
    "respuestas_completadas",
  ];

  if (ds.preferences.length === 0) {
    return (
      headers.join(",") +
      "\n# sin datos aún — generado " +
      ds.generatedAt +
      "\n"
    );
  }

  const profByPseudo = new Map(ds.profiles.map((p) => [p.pseudo, p]));
  const respuestasCount = new Map<string, number>();
  for (const a of ds.answers) {
    respuestasCount.set(a.student_pseudo, (respuestasCount.get(a.student_pseudo) ?? 0) + 1);
  }

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = ds.preferences.map((p) => {
    const prof = profByPseudo.get(p.student_pseudo);
    return [
      p.student_pseudo,
      prof?.facultad ?? "",
      prof?.carrera ?? "",
      prof?.ciclo ?? "",
      prof?.rango_edad ?? "",
      prof?.genero ?? "",
      prof?.questionnaire_completed_at ?? "",
      p.compare_order_at_submit,
      p.candidato_preferido,
      p.confianza,
      p.motivo ?? "",
      p.submitted_at,
      respuestasCount.get(p.student_pseudo) ?? 0,
    ]
      .map(escape)
      .join(",");
  });

  return headers.join(",") + "\n" + rows.join("\n") + "\n";
}

/**
 * Genera el archivo `.pbids` que apunta al CSV. Power BI Desktop lo abre
 * directamente y configura la conexión.
 *
 * Nota: el path es relativo al lugar donde el docente guarde el CSV. Se
 * documenta en quickstart cómo usarlo.
 */
export function exportPbidsManifest(): string {
  return JSON.stringify(
    {
      version: "0.1",
      connections: [
        {
          details: {
            protocol: "file",
            address: { path: "voto-informado-upao.csv" },
          },
          options: {
            EncodingType: 65001,
            Delimiter: ",",
          },
          mode: "Import",
        },
      ],
    },
    null,
    2,
  );
}
