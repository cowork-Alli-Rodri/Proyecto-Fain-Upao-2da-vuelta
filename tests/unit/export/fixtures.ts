/**
 * Fixtures compartidos para tests de exports.
 */

import type { ExportDataset } from "@/lib/export/dataset";

export function emptyDataset(
  overrides: Partial<ExportDataset> = {},
): ExportDataset {
  return {
    profiles: [],
    answers: [],
    preferences: [],
    generatedAt: "2026-05-22T15:00:00.000Z",
    filters: { facultad: null, carrera: null, ciclo: null, from: null, to: null },
    anonymize: "pseudonym",
    ...overrides,
  };
}

export function sampleDataset(
  anonymize: ExportDataset["anonymize"] = "pseudonym",
  overrides: Partial<ExportDataset> = {},
): ExportDataset {
  const pseudoA = "anon-aaaaaaaaaaaa";
  const pseudoB = "anon-bbbbbbbbbbbb";

  return {
    profiles: [
      {
        id: anonymize === "none" ? "user-aaaa" : pseudoA,
        pseudo: anonymize === "none" ? "user-aaaa" : pseudoA,
        email: anonymize === "none" ? "ana@upao.edu.pe" : null,
        nombres: anonymize === "none" ? "Ana" : null,
        apellidos: anonymize === "none" ? "Pérez" : null,
        facultad: "Facultad de Ingeniería",
        carrera: "Ingeniería de Sistemas",
        ciclo: 6,
        rango_edad: "18-22",
        genero: "F",
        current_step: 12,
        questionnaire_completed_at: "2026-05-20T10:00:00.000Z",
        questionnaire_pre_completed_at: "2026-05-20T09:00:00.000Z",
        candidatos_completed_at: "2026-05-20T09:30:00.000Z",
        questionnaire_post_completed_at: "2026-05-20T10:00:00.000Z",
        created_at: "2026-05-15T10:00:00.000Z",
      },
      {
        id: anonymize === "none" ? "user-bbbb" : pseudoB,
        pseudo: anonymize === "none" ? "user-bbbb" : pseudoB,
        email: anonymize === "none" ? "bruno@upao.edu.pe" : null,
        nombres: anonymize === "none" ? "Bruno" : null,
        apellidos: anonymize === "none" ? "García" : null,
        facultad: "Facultad de Derecho",
        carrera: "Derecho",
        ciclo: 8,
        rango_edad: "23-27",
        genero: "M",
        current_step: 12,
        questionnaire_completed_at: "2026-05-21T10:00:00.000Z",
        questionnaire_pre_completed_at: "2026-05-21T09:00:00.000Z",
        candidatos_completed_at: "2026-05-21T09:30:00.000Z",
        questionnaire_post_completed_at: "2026-05-21T10:00:00.000Z",
        created_at: "2026-05-16T10:00:00.000Z",
      },
    ],
    answers: [
      {
        student_pseudo: anonymize === "none" ? "user-aaaa" : pseudoA,
        question_id: "q-001",
        question_snapshot: "¿Qué tan de acuerdo estás con X?",
        dimension_snapshot: "social",
        dimension_cuestionario_snapshot: "educacion",
        tipo_snapshot: "likert",
        momento_snapshot: "pre",
        valor: { value: 4 },
        responded_at: "2026-05-20T09:55:00.000Z",
      },
    ],
    preferences: [
      {
        student_pseudo: anonymize === "none" ? "user-aaaa" : pseudoA,
        candidato_preferido: "keiko",
        confianza: 7,
        motivo: anonymize === "full" ? null : "Confío en su trayectoria.",
        submitted_at: "2026-05-20T11:00:00.000Z",
      },
      {
        student_pseudo: anonymize === "none" ? "user-bbbb" : pseudoB,
        candidato_preferido: "roberto",
        confianza: 9,
        motivo: anonymize === "full" ? null : "Plan social más sólido.",
        submitted_at: "2026-05-21T11:00:00.000Z",
      },
    ],
    generatedAt: "2026-05-22T15:00:00.000Z",
    filters: { facultad: null, carrera: null, ciclo: null, from: null, to: null },
    anonymize,
    ...overrides,
  };
}
