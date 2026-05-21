/**
 * Parser de filtros del dashboard desde URL searchParams.
 * Los filtros se mantienen en la URL para deep-linking y back/forward del browser.
 */

export interface DashboardFilters {
  facultad: string | null;
  carrera: string | null;
  ciclo: number | null;
  from: string | null; // ISO date
  to: string | null;
}

export function parseFilters(params: URLSearchParams | Record<string, string | undefined>): DashboardFilters {
  const get = (k: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(k);
    }
    const v = params[k];
    return v && v !== "" ? v : null;
  };

  const cicloRaw = get("ciclo");
  const ciclo = cicloRaw ? Number(cicloRaw) : null;

  return {
    facultad: get("facultad"),
    carrera: get("carrera"),
    ciclo: ciclo && Number.isFinite(ciclo) && ciclo >= 1 && ciclo <= 14 ? ciclo : null,
    from: get("from"),
    to: get("to"),
  };
}

export function filtersToSearchParams(filters: DashboardFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.facultad) sp.set("facultad", filters.facultad);
  if (filters.carrera) sp.set("carrera", filters.carrera);
  if (filters.ciclo) sp.set("ciclo", String(filters.ciclo));
  if (filters.from) sp.set("from", filters.from);
  if (filters.to) sp.set("to", filters.to);
  return sp;
}

export function hasActiveFilters(f: DashboardFilters): boolean {
  return Boolean(f.facultad || f.carrera || f.ciclo || f.from || f.to);
}
