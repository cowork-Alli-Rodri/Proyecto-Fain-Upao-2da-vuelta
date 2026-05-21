"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuestion,
  updateQuestion,
} from "@/app/(admin)/admin/preguntas/_actions";
import {
  DIMENSION_LABEL,
  DIMENSION_VALUES,
  QUESTION_TYPE_LABEL,
  QUESTION_TYPE_VALUES,
  defaultOpcionesForType,
  type DimensionTematica,
  type QuestionType,
} from "@/lib/validation/question.schema";
import { ERROR_MESSAGES } from "@/lib/errors";

export interface QuestionDraft {
  id?: string;
  orden: number;
  dimension_tematica: DimensionTematica;
  tipo: QuestionType;
  enunciado: string;
  fuente: string;
  activo: boolean;
  opciones: unknown;
}

export function QuestionEditor({
  initial,
  mode,
}: {
  initial: QuestionDraft;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function patch<K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleTypeChange(next: QuestionType) {
    if (next === draft.tipo) return;
    setDraft((d) => ({
      ...d,
      tipo: next,
      opciones: defaultOpcionesForType(next),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      orden: draft.orden,
      dimension_tematica: draft.dimension_tematica,
      tipo: draft.tipo,
      enunciado: draft.enunciado.trim(),
      opciones: draft.opciones,
      fuente: draft.fuente.trim(),
      activo: draft.activo,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createQuestion(payload)
          : await updateQuestion(draft.id!, payload);
      if (!result.ok) {
        if (result.error.code === "ValidationError") {
          setError({ field: result.error.field, message: result.error.message });
        } else {
          setError({ field: "_", message: ERROR_MESSAGES[result.error.code] });
        }
        return;
      }
      router.push("/admin/preguntas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Section kicker="01" title="Metadatos">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field id="orden" label="Orden" hint="Posición visible al estudiante.">
            <Input
              id="orden"
              type="number"
              min={1}
              max={200}
              value={draft.orden}
              onChange={(e) => patch("orden", Number(e.target.value || 0))}
            />
          </Field>
          <Field id="dimension" label="Dimensión JNE">
            <Select
              value={draft.dimension_tematica}
              onValueChange={(v) => patch("dimension_tematica", v as DimensionTematica)}
            >
              <SelectTrigger id="dimension">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_VALUES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DIMENSION_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="tipo" label="Tipo de pregunta">
            <Select
              value={draft.tipo}
              onValueChange={(v) => handleTypeChange(v as QuestionType)}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPE_VALUES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {QUESTION_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section kicker="02" title="Enunciado">
        <Field id="enunciado" label="Texto de la pregunta">
          <Textarea
            id="enunciado"
            value={draft.enunciado}
            rows={3}
            maxLength={500}
            onChange={(e) => patch("enunciado", e.target.value)}
            placeholder="Redacta el enunciado en lenguaje neutral. Sin etiquetas valorativas."
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {draft.enunciado.length} / 500
          </p>
        </Field>
        <Field id="fuente" label="Fuente (opcional)" hint="IPE, BCRP, ENAHO, JNE, etc.">
          <Input
            id="fuente"
            value={draft.fuente}
            onChange={(e) => patch("fuente", e.target.value)}
            placeholder="Ejemplo: BCRP Reporte de Inflación, junio 2025."
          />
        </Field>
      </Section>

      <Section kicker="03" title="Opciones">
        <OpcionesEditor
          tipo={draft.tipo}
          value={draft.opciones}
          onChange={(next) => patch("opciones", next)}
        />
      </Section>

      <Section kicker="04" title="Visibilidad">
        <label className="flex items-center gap-3 text-sm text-[var(--color-graphite)]">
          <input
            type="checkbox"
            checked={draft.activo}
            onChange={(e) => patch("activo", e.target.checked)}
            className="size-4 rounded border-[var(--color-border)] text-[var(--color-navy-upao)]"
          />
          La pregunta está activa y aparece en el cuestionario.
        </label>
      </Section>

      {error ? (
        <p className="rounded-md border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/10 px-3 py-2 text-sm text-[var(--color-coral-pulse)]">
          {error.field && error.field !== "_" ? <strong>{error.field}: </strong> : null}
          {error.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/preguntas")}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear pregunta" : "Guardar cambios"}
        </Button>
      </div>
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
    <section className="space-y-5">
      <header className="flex items-baseline gap-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
          {kicker}
        </span>
        <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
          {title}
        </h2>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-[var(--color-ink)]">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}

// ============================================================================
// Editor del campo `opciones` — switch por tipo
// ============================================================================

function OpcionesEditor({
  tipo,
  value,
  onChange,
}: {
  tipo: QuestionType;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (tipo === "text") {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
        Las preguntas de tipo texto libre no requieren opciones. El estudiante
        responde con un máximo de 1000 caracteres.
      </p>
    );
  }

  if (tipo === "likert") {
    return <LikertEditor value={value} onChange={onChange} />;
  }

  if (tipo === "single" || tipo === "multiple") {
    return <ChoicesEditor tipo={tipo} value={value} onChange={onChange} />;
  }

  if (tipo === "ranking") {
    return <RankingEditor value={value} onChange={onChange} />;
  }

  if (tipo === "comparison") {
    return <ComparisonEditor value={value} onChange={onChange} />;
  }

  return null;
}

// ----- Likert -----

interface ScaleItem {
  value: number;
  label: string;
}

function LikertEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const scale = useMemo<ScaleItem[]>(() => {
    const v = value as { scale?: ScaleItem[] } | null;
    return v?.scale ?? [];
  }, [value]);

  function setScale(next: ScaleItem[]) {
    onChange({ scale: next });
  }

  return (
    <div className="space-y-3">
      {scale.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={5}
            value={item.value}
            onChange={(e) => {
              const next = [...scale];
              next[idx] = { ...item, value: Number(e.target.value || 0) };
              setScale(next);
            }}
            className="w-20"
          />
          <Input
            value={item.label}
            onChange={(e) => {
              const next = [...scale];
              next[idx] = { ...item, label: e.target.value };
              setScale(next);
            }}
            placeholder="Etiqueta visible al estudiante"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale(scale.filter((_, i) => i !== idx))}
            aria-label="Eliminar nivel"
            disabled={scale.length <= 2}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setScale([
            ...scale,
            { value: (scale[scale.length - 1]?.value ?? 0) + 1, label: "" },
          ])
        }
        disabled={scale.length >= 5}
      >
        <Plus className="size-3.5" /> Añadir nivel
      </Button>
    </div>
  );
}

// ----- Single / Multiple choice -----

interface ChoiceItem {
  id: string;
  label: string;
}

function ChoicesEditor({
  tipo,
  value,
  onChange,
}: {
  tipo: "single" | "multiple";
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const choices = useMemo<ChoiceItem[]>(() => {
    const v = value as { choices?: ChoiceItem[] } | null;
    return v?.choices ?? [];
  }, [value]);

  function setChoices(next: ChoiceItem[]) {
    onChange({ mode: tipo, choices: next });
  }

  function nextId(): string {
    const used = new Set(choices.map((c) => c.id));
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!used.has(letter)) return letter;
    }
    return `O${choices.length + 1}`;
  }

  return (
    <div className="space-y-3">
      {choices.map((choice, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <Input
            value={choice.id}
            onChange={(e) => {
              const next = [...choices];
              next[idx] = { ...choice, id: e.target.value };
              setChoices(next);
            }}
            className="w-20"
            placeholder="ID"
          />
          <Input
            value={choice.label}
            onChange={(e) => {
              const next = [...choices];
              next[idx] = { ...choice, label: e.target.value };
              setChoices(next);
            }}
            placeholder="Etiqueta de la opción"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setChoices(choices.filter((_, i) => i !== idx))}
            aria-label="Eliminar opción"
            disabled={choices.length <= 2}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setChoices([...choices, { id: nextId(), label: "" }])}
        disabled={tipo === "single" ? choices.length >= 8 : choices.length >= 10}
      >
        <Plus className="size-3.5" /> Añadir opción
      </Button>
    </div>
  );
}

// ----- Ranking -----

function RankingEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const items = useMemo<string[]>(() => {
    const v = value as { items?: string[] } | null;
    return v?.items ?? [];
  }, [value]);

  function setItems(next: string[]) {
    onChange({ items: next });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        El estudiante reordenará estos ítems de mayor a menor prioridad. Mantén
        los enunciados breves.
      </p>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <GripVertical className="size-4 text-[var(--color-muted-foreground)]" aria-hidden />
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              setItems(next);
            }}
            placeholder="Ítem rankeable"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setItems(items.filter((_, i) => i !== idx))}
            aria-label="Eliminar ítem"
            disabled={items.length <= 2}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setItems([...items, ""])}
        disabled={items.length >= 8}
      >
        <Plus className="size-3.5" /> Añadir ítem
      </Button>
    </div>
  );
}

// ----- Comparison -----

function ComparisonEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const v = (value as { axis_label?: string } | null) ?? {};
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Pregunta de comparación: el estudiante puntúa a Keiko y Roberto del 1 al 5
        en la misma dimensión. No requiere opciones; solo una etiqueta de eje.
      </p>
      <Field id="axis_label" label="Etiqueta del eje (opcional)">
        <Input
          id="axis_label"
          value={v.axis_label ?? ""}
          onChange={(e) =>
            onChange({ mode: "comparison", axis_label: e.target.value || undefined })
          }
          placeholder="Ejemplo: ¿qué tan claro es su plan?"
        />
      </Field>
    </div>
  );
}
