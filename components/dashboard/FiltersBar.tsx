"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filtersToSearchParams,
  type DashboardFilters,
} from "@/lib/dashboard/filters";

interface Options {
  facultades: string[];
  carreras: string[];
  ciclos: number[];
}

const ALL = "__all__";

export function FiltersBar({
  options,
  initialFilters,
}: {
  options: Options;
  initialFilters: DashboardFilters;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setFilter(key: keyof DashboardFilters, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (!value || value === ALL) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      router.replace(`/dashboard?${next.toString()}`, { scroll: false });
    });
  }

  function clearAll() {
    startTransition(() => {
      router.replace("/dashboard", { scroll: false });
    });
  }

  const built = filtersToSearchParams(initialFilters);
  const activeCount = Array.from(built.keys()).length;

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="space-y-1">
            <label className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Facultad
            </label>
            <Select
              value={initialFilters.facultad ?? ALL}
              onValueChange={(v) => setFilter("facultad", v)}
              disabled={pending}
            >
              <SelectTrigger className="h-10 min-w-[200px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las facultades</SelectItem>
                {options.facultades.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Carrera
            </label>
            <Select
              value={initialFilters.carrera ?? ALL}
              onValueChange={(v) => setFilter("carrera", v)}
              disabled={pending}
            >
              <SelectTrigger className="h-10 min-w-[200px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las carreras</SelectItem>
                {options.carreras.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Ciclo
            </label>
            <Select
              value={initialFilters.ciclo ? String(initialFilters.ciclo) : ALL}
              onValueChange={(v) => setFilter("ciclo", v)}
              disabled={pending}
            >
              <SelectTrigger className="h-10 min-w-[120px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {options.ciclos.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Ciclo {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Desde
            </label>
            <input
              type="date"
              value={initialFilters.from ?? ""}
              onChange={(e) => setFilter("from", e.target.value || null)}
              disabled={pending}
              className="h-10 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Hasta
            </label>
            <input
              type="date"
              value={initialFilters.to ?? ""}
              onChange={(e) => setFilter("to", e.target.value || null)}
              disabled={pending}
              className="h-10 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
            />
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              disabled={pending}
              className="ml-auto h-10 rounded-full border border-[var(--color-border-strong)] px-4 text-xs font-medium text-[var(--color-graphite)] transition hover:border-[var(--color-coral-pulse)] hover:text-[var(--color-coral-pulse)]"
            >
              Limpiar {activeCount} filtro{activeCount === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
