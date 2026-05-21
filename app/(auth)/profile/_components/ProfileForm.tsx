"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
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
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombres">Nombres</Label>
          <Input
            id="nombres"
            required
            minLength={2}
            maxLength={100}
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input
            id="apellidos"
            required
            minLength={2}
            maxLength={100}
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="facultad">Facultad</Label>
          <Select
            value={facultad}
            onValueChange={(v) => {
              setFacultad(v);
              setCarrera("");
            }}
            disabled={pending}
          >
            <SelectTrigger id="facultad">
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="carrera">Carrera</Label>
          <Select
            value={carrera}
            onValueChange={setCarrera}
            disabled={!facultad || pending}
          >
            <SelectTrigger id="carrera">
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ciclo">Ciclo</Label>
          <Select value={ciclo} onValueChange={setCiclo} disabled={pending}>
            <SelectTrigger id="ciclo">
              <SelectValue placeholder="Ciclo actual" />
            </SelectTrigger>
            <SelectContent>
              {CICLOS.map((c) => (
                <SelectItem key={c} value={String(c)}>
                  Ciclo {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rangoEdad">Rango de edad</Label>
          <Select value={rangoEdad} onValueChange={setRangoEdad} disabled={pending}>
            <SelectTrigger id="rangoEdad">
              <SelectValue placeholder="Rango" />
            </SelectTrigger>
            <SelectContent>
              {RANGOS_EDAD.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="genero">Género (opcional)</Label>
          <Select value={genero} onValueChange={setGenero} disabled={pending}>
            <SelectTrigger id="genero">
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
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-coral-pulse)]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
      >
        {pending ? "Guardando..." : "Guardar y comenzar cuestionario"}
      </Button>
    </form>
  );
}
