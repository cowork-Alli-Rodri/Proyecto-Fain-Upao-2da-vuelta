"use client";

import { useMemo, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "../_actions";
import {
  CARRERAS_POR_FACULTAD,
  CICLOS,
  FACULTADES,
  GENEROS,
  RANGOS_EDAD,
  type Facultad,
} from "@/lib/constants/upao";
import { ERROR_MESSAGES } from "@/lib/errors";

interface Defaults {
  nombres?: string;
  apellidos?: string;
  facultad?: string;
  carrera?: string;
  ciclo?: number;
  rango_edad?: string;
  genero?: string | null;
}

export function ProfileForm({ defaults }: { defaults: Defaults }) {
  const [nombres, setNombres] = useState(defaults.nombres ?? "");
  const [apellidos, setApellidos] = useState(defaults.apellidos ?? "");
  const [facultad, setFacultad] = useState<string>(defaults.facultad ?? "");
  const [carrera, setCarrera] = useState<string>(defaults.carrera ?? "");
  const [ciclo, setCiclo] = useState<string>(defaults.ciclo ? String(defaults.ciclo) : "");
  const [rangoEdad, setRangoEdad] = useState<string>(defaults.rango_edad ?? "");
  const [genero, setGenero] = useState<string>(defaults.genero ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const carrerasDisponibles = useMemo(() => {
    if (!facultad) return [];
    return CARRERAS_POR_FACULTAD[facultad as Facultad] ?? [];
  }, [facultad]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        facultad,
        carrera,
        ciclo: Number(ciclo),
        rango_edad: rangoEdad,
        genero: genero || undefined,
      });
      if (!result.ok) {
        const msg =
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code];
        setError(msg);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sección: Identidad */}
      <Section kicker="01" title="Tu identidad">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="nombres" label="Nombres">
            <Input
              id="nombres"
              required
              minLength={2}
              maxLength={100}
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              disabled={pending}
              placeholder="Ej. María Lucía"
              className="h-12 bg-[var(--color-surface)]"
            />
          </Field>
          <Field id="apellidos" label="Apellidos">
            <Input
              id="apellidos"
              required
              minLength={2}
              maxLength={100}
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              disabled={pending}
              placeholder="Ej. Vásquez Torres"
              className="h-12 bg-[var(--color-surface)]"
            />
          </Field>
        </div>
      </Section>

      {/* Sección: Académico */}
      <Section kicker="02" title="Tu programa académico">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="facultad" label="Facultad">
            <Select
              value={facultad}
              onValueChange={(v) => {
                setFacultad(v);
                setCarrera("");
              }}
              disabled={pending}
            >
              <SelectTrigger id="facultad" className="h-12 bg-[var(--color-surface)]">
                <SelectValue placeholder="Selecciona tu facultad" />
              </SelectTrigger>
              <SelectContent>
                {FACULTADES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="carrera" label="Carrera">
            <Select value={carrera} onValueChange={setCarrera} disabled={!facultad || pending}>
              <SelectTrigger id="carrera" className="h-12 bg-[var(--color-surface)]">
                <SelectValue
                  placeholder={
                    facultad ? "Selecciona tu carrera" : "Primero elige facultad"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {carrerasDisponibles.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-5">
          <Field id="ciclo" label="Ciclo actual">
            <Select value={ciclo} onValueChange={setCiclo} disabled={pending}>
              <SelectTrigger id="ciclo" className="h-12 bg-[var(--color-surface)]">
                <SelectValue placeholder="Selecciona tu ciclo" />
              </SelectTrigger>
              <SelectContent>
                {CICLOS.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Ciclo {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Sección: Demográfico opcional */}
      <Section kicker="03" title="Datos demográficos">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="rangoEdad" label="Rango de edad">
            <Select value={rangoEdad} onValueChange={setRangoEdad} disabled={pending}>
              <SelectTrigger id="rangoEdad" className="h-12 bg-[var(--color-surface)]">
                <SelectValue placeholder="Selecciona tu rango" />
              </SelectTrigger>
              <SelectContent>
                {RANGOS_EDAD.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r} años
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="genero" label="Género (opcional)">
            <Select value={genero} onValueChange={setGenero} disabled={pending}>
              <SelectTrigger id="genero" className="h-12 bg-[var(--color-surface)]">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {GENEROS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 px-4 py-3 text-sm text-[var(--color-coral-pulse)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy-upao)] px-5 py-4 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar y comenzar cuestionario"}
        <span
          aria-hidden
          className="inline-block transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    </form>
  );
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-l-2 border-[var(--color-border)] pl-6">
      <header className="flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-widest text-[var(--color-cyan-deep)]">
          {kicker}
        </span>
        <h2 className="font-display text-xl text-[var(--color-navy-upao)]">{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[var(--color-foreground)]">
        {label}
      </Label>
      {children}
    </div>
  );
}
