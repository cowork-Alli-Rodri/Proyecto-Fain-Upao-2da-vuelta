# Datos JNE — Voto Informado 2026

Seed inicial de datos oficiales extraídos del portal `votoinformado.jne.gob.pe` el 2026-05-20.

## Fuente y método

- Portal: `https://votoinformado.jne.gob.pe/presidente-vicepresidentes` (Angular SPA).
- API real descubierta vía inspección del bundle JS: `https://web.jne.gob.pe/serviciovotoinformado`.
- Autenticación: GET `/api/authentication/token` → header `X-Session-Token` en requests posteriores.
- Proceso electoral: `idProcesoElectoral=124` (Elecciones Generales 2026).
- Tipo de elección: `idTipoEleccion=1` (Presidencial).

## Archivos

### `raw/`

JSONs crudos tal como los devuelve la API JNE — payload de auditoría.

| Archivo | Contenido |
|---|---|
| `candidatos-presidenciales-todos.json` | Lista completa de candidatos presidenciales + vicepresidenciales (108 filas, 36 fórmulas) |
| `keiko-fp-plan-header.json` | Header del plan de gobierno de Keiko Fujimori (idPlanGobierno 29690) |
| `keiko-fp-plan-detalle.json` | Detalle del plan con 4 dimensiones (Social, Económica, Ambiental, Institucional) |
| `keiko-fp-formula.json` | Fórmula presidencial Fuerza Popular (búsqueda avanzada) |
| `roberto-jpp-plan-header.json` | Header del plan de gobierno de Roberto Sánchez (idPlanGobierno 29688) |
| `roberto-jpp-plan-detalle.json` | Detalle del plan con 4 dimensiones |
| `roberto-jpp-formula.json` | Fórmula presidencial Juntos por el Perú |

## Finalistas Segunda Vuelta 2026

- **Keiko Sofía Fujimori Higuchi** — FUERZA POPULAR — idOrganizacionPolitica `1366` — idPlanGobierno `29690` — expediente `EG.2026015411` — PDF plan: https://mpesije.jne.gob.pe/docs/da4b943d-4344-4743-9362-a11ccf3054cb.pdf
- **Roberto Helbert Sánchez Palomino** — JUNTOS POR EL PERU — idOrganizacionPolitica `1264` — idPlanGobierno `29688` — expediente `EG.2026016259` — PDF plan: https://mpesije.jne.gob.pe/docs/3dd0e649-061c-4f31-8c3f-7a0836b58bde.pdf

## Refresh

Los datos en vivo se refrescan vía Vercel Cron (24h) usando el cliente tipado en `lib/jne/api.ts`. Estos JSONs sirven de fallback y seed inicial de la base de datos.
