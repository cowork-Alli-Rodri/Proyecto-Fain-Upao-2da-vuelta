/**
 * k6 smoke load test — flujo de estudiante.
 *
 * Simula 500 estudiantes concurrentes ejecutando:
 *   1. GET /                         → landing
 *   2. GET /login                    → pantalla de login
 *   3. GET /como-funciona            → marketing
 *   4. GET /api/cron/jne-refresh     → debe devolver 401 sin auth (sanity)
 *
 * El flujo completo de auth + cuestionario + preferencia requiere
 * registrarse y mantener cookies, lo que rebasa el alcance de un smoke
 * test. Este test valida SC-008 (p95 < 2s) y FR-043 contra rutas
 * públicas + el rate de fallos del servidor bajo carga.
 *
 * Uso:
 *   pnpm dev          # en una terminal
 *   pnpm run load-test # en otra (requiere k6 instalado: https://k6.io/docs/get-started/installation/)
 *
 * Para apuntar a otra base:
 *   k6 run -e BASE_URL=https://staging.votoinformado-upao.com tests/load/student-flow.js
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    smoke: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 500 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"], // SC-008
    http_req_failed: ["rate<0.01"],    // <1% errores
    checks: ["rate>0.99"],
  },
};

export default function studentFlow() {
  const r1 = http.get(`${BASE_URL}/`);
  check(r1, {
    "/ devuelve 200": (r) => r.status === 200,
    "/ devuelve HTML": (r) => (r.headers["Content-Type"] || "").includes("text/html"),
  });
  sleep(1);

  const r2 = http.get(`${BASE_URL}/login`);
  check(r2, {
    "/login devuelve 200": (r) => r.status === 200,
  });
  sleep(1);

  const r3 = http.get(`${BASE_URL}/como-funciona`);
  check(r3, {
    "/como-funciona devuelve 200": (r) => r.status === 200,
  });
  sleep(0.5);

  const r4 = http.get(`${BASE_URL}/api/cron/jne-refresh`);
  check(r4, {
    "cron sin auth devuelve 401": (r) => r.status === 401,
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        p95_ms: data.metrics.http_req_duration?.values?.["p(95)"] ?? null,
        avg_ms: data.metrics.http_req_duration?.values?.avg ?? null,
        failed_rate: data.metrics.http_req_failed?.values?.rate ?? null,
        total_requests: data.metrics.http_reqs?.values?.count ?? null,
      },
      null,
      2,
    ),
  };
}
