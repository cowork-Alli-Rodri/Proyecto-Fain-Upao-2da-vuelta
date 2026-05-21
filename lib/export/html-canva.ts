import type { ExportDataset } from "./dataset";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Genera un HTML autocontenido importable a Canva.
 * - Cero recursos externos (CSS inline, sin fuentes web).
 * - Bloques con data-canva-block para que Canva los detecte editables.
 * - Datos crudos embebidos en <script type="application/json">.
 */
export function exportHtmlCanva(ds: ExportDataset): string {
  const total_inscritos = ds.profiles.length;
  const total_completados = ds.profiles.filter((p) => p.questionnaire_completed_at).length;
  const total_preferencias = ds.preferences.length;
  const sin_preferencia = Math.max(0, total_completados - total_preferencias);
  const confianzaProm =
    ds.preferences.length > 0
      ? (ds.preferences.reduce((a, b) => a + b.confianza, 0) / ds.preferences.length).toFixed(2)
      : "—";

  const distribution = (["keiko", "roberto", "indeciso"] as const).map((c) => {
    const n = ds.preferences.filter((p) => p.candidato_preferido === c).length;
    const pct = ds.preferences.length > 0 ? (n / ds.preferences.length) * 100 : 0;
    return { c, n, pct: Math.round(pct * 10) / 10 };
  });

  const carreraStats = new Map<string, { keiko: number; roberto: number; indeciso: number; total: number }>();
  const profByPseudo = new Map(ds.profiles.map((p) => [p.pseudo, p]));
  for (const p of ds.preferences) {
    const prof = profByPseudo.get(p.student_pseudo);
    if (!prof?.carrera) continue;
    const row = carreraStats.get(prof.carrera) ?? { keiko: 0, roberto: 0, indeciso: 0, total: 0 };
    row[p.candidato_preferido as "keiko" | "roberto" | "indeciso"]++;
    row.total++;
    carreraStats.set(prof.carrera, row);
  }
  const topCarreras = Array.from(carreraStats.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const dataPayload = {
    generatedAt: ds.generatedAt,
    filters: ds.filters,
    anonymize: ds.anonymize,
    distribution,
    carreras: Object.fromEntries(carreraStats.entries()),
    preferences: ds.preferences.length,
    respuestas: ds.answers.length,
  };

  return `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="utf-8">
<title>Dashboard · Voto Informado UPAO · ${escapeHtml(ds.generatedAt)}</title>
<style>
  :root {
    --navy: #002855;
    --cyan: #0093b8;
    --keiko: #f26522;
    --roberto: #2d8b47;
    --indeciso: #999;
    --ink: #0e1014;
    --smoke: #5c6470;
    --paper: #fafafc;
    --line: #e2e2e8;
  }
  body { font-family: 'Helvetica Neue', system-ui, sans-serif; margin: 0; padding: 48px; background: var(--paper); color: var(--ink); }
  .wrap { max-width: 1100px; margin: 0 auto; }
  h1 { font-family: Georgia, serif; font-size: 48px; line-height: 1.05; margin: 0 0 8px; color: var(--navy); }
  h2 { font-family: Georgia, serif; font-size: 28px; color: var(--navy); margin: 32px 0 12px; }
  .kicker { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--cyan); margin: 0; }
  .rule { height: 1px; background: var(--navy); margin: 8px 0 16px; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
  .kpi { background: white; border: 1px solid var(--line); padding: 20px; border-radius: 12px; }
  .kpi-value { font-family: ui-monospace, monospace; font-size: 42px; font-weight: 500; color: var(--navy); margin: 8px 0; }
  .kpi-label { font-size: 12px; color: var(--smoke); margin: 0; }
  .bars { background: white; border: 1px solid var(--line); padding: 24px; border-radius: 12px; }
  .bar-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; font-size: 13px; }
  .bar-name { width: 200px; }
  .bar-track { flex: 1; height: 16px; background: #eee; border-radius: 8px; overflow: hidden; display: flex; }
  .bar-segment { height: 100%; }
  .bar-segment.keiko { background: var(--keiko); }
  .bar-segment.roberto { background: var(--roberto); }
  .bar-segment.indeciso { background: var(--indeciso); }
  .bar-count { font-family: ui-monospace, monospace; font-size: 11px; color: var(--smoke); width: 40px; text-align: right; }
  .legend { display: flex; gap: 16px; margin-top: 16px; font-size: 11px; color: var(--smoke); }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-swatch { width: 12px; height: 12px; border-radius: 50%; }
  footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 11px; color: var(--smoke); }
</style>
</head>
<body>
<main class="wrap">
  <header data-canva-block="title">
    <p class="kicker">Dashboard · Voto Informado UPAO · Segunda Vuelta 2026</p>
    <div class="rule"></div>
    <h1>Resumen del grupo</h1>
    <p>Generado el ${escapeHtml(new Date(ds.generatedAt).toLocaleString("es-PE"))} · Anonimización: ${escapeHtml(ds.anonymize)}</p>
  </header>

  <section data-canva-block="kpis">
    <p class="kicker">Indicadores clave</p>
    <div class="kpis">
      <div class="kpi"><p class="kpi-label">Inscritos</p><p class="kpi-value">${total_inscritos}</p></div>
      <div class="kpi"><p class="kpi-label">Completaron cuestionario</p><p class="kpi-value">${total_completados}</p></div>
      <div class="kpi"><p class="kpi-label">Declararon preferencia</p><p class="kpi-value">${total_preferencias}</p></div>
      <div class="kpi"><p class="kpi-label">Sin preferencia</p><p class="kpi-value">${sin_preferencia}</p></div>
      <div class="kpi"><p class="kpi-label">Confianza promedio</p><p class="kpi-value">${confianzaProm}</p></div>
      <div class="kpi"><p class="kpi-label">Tasa de avance</p><p class="kpi-value">${total_inscritos > 0 ? Math.round((total_completados / total_inscritos) * 100) : 0}%</p></div>
    </div>
  </section>

  <section data-canva-block="preferencia-distribution">
    <h2>Distribución de preferencia</h2>
    <div class="bars">
      ${distribution
        .map(
          (d) => `
        <div class="bar-row">
          <span class="bar-name">${d.c === "keiko" ? "Keiko Fujimori" : d.c === "roberto" ? "Roberto Sánchez" : "Indeciso/a"}</span>
          <div class="bar-track"><div class="bar-segment ${d.c}" style="width: ${d.pct}%"></div></div>
          <span class="bar-count">${d.n} · ${d.pct}%</span>
        </div>`,
        )
        .join("")}
    </div>
  </section>

  <section data-canva-block="por-carrera">
    <h2>Preferencia por carrera (top 10)</h2>
    <div class="bars">
      ${
        topCarreras.length === 0
          ? '<p style="color:var(--smoke);">Sin datos aún.</p>'
          : topCarreras
              .map(([carrera, row]) => {
                const keikoPct = (row.keiko / row.total) * 100;
                const robertoPct = (row.roberto / row.total) * 100;
                const indecisoPct = (row.indeciso / row.total) * 100;
                return `
        <div class="bar-row">
          <span class="bar-name">${escapeHtml(carrera)}</span>
          <div class="bar-track">
            ${row.keiko > 0 ? `<div class="bar-segment keiko" style="width: ${keikoPct}%"></div>` : ""}
            ${row.roberto > 0 ? `<div class="bar-segment roberto" style="width: ${robertoPct}%"></div>` : ""}
            ${row.indeciso > 0 ? `<div class="bar-segment indeciso" style="width: ${indecisoPct}%"></div>` : ""}
          </div>
          <span class="bar-count">${row.total}</span>
        </div>`;
              })
              .join("")
      }
      <div class="legend">
        <div class="legend-item"><div class="legend-swatch" style="background: var(--keiko);"></div>Keiko</div>
        <div class="legend-item"><div class="legend-swatch" style="background: var(--roberto);"></div>Roberto</div>
        <div class="legend-item"><div class="legend-swatch" style="background: var(--indeciso);"></div>Indeciso/a</div>
      </div>
    </div>
  </section>

  <footer>
    <p>Datos del Jurado Nacional de Elecciones (JNE) · Voto Informado UPAO · ${escapeHtml(ds.generatedAt)}</p>
    <p>Esta plataforma no emite recomendaciones de voto. Análisis pedagógico del docente.</p>
  </footer>
</main>

<!-- Dataset crudo embebido para procesar en Canva o downstream -->
<script type="application/json" id="dataset">${JSON.stringify(dataPayload)}</script>
</body>
</html>`;
}
