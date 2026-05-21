"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, EyeOff, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  reorderQuestions,
  toggleQuestionActive,
} from "@/app/(admin)/admin/preguntas/_actions";
import {
  DIMENSION_LABEL,
  QUESTION_TYPE_LABEL,
  type DimensionTematica,
  type QuestionType,
} from "@/lib/validation/question.schema";
import { ERROR_MESSAGES } from "@/lib/errors";

export interface QuestionRow {
  id: string;
  orden: number;
  dimension_tematica: DimensionTematica;
  tipo: QuestionType;
  enunciado: string;
  activo: boolean;
}

const DIMENSION_TINT: Record<DimensionTematica, string> = {
  social: "var(--color-cyan-deep)",
  economica: "var(--color-mango-sun)",
  ambiental: "var(--color-mint-success)",
  institucional: "var(--color-coral-pulse)",
};

export function QuestionList({ rows }: { rows: QuestionRow[] }) {
  const router = useRouter();

  // Reordenado optimista: guardamos la secuencia de ids durante un drag.
  // Al confirmar el server con router.refresh(), `rows` llega actualizado
  // y reseteamos el override a null.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const [pendingReorder, startReorder] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const items = useMemo<QuestionRow[]>(() => {
    if (!pendingOrder) return rows;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const reordered: QuestionRow[] = [];
    for (let i = 0; i < pendingOrder.length; i++) {
      const row = byId.get(pendingOrder[i]!);
      if (row) reordered.push({ ...row, orden: i + 1 });
    }
    // Append cualquier fila nueva no presente en pendingOrder (defensivo).
    for (const r of rows) {
      if (!pendingOrder.includes(r.id)) reordered.push(r);
    }
    return reordered;
  }, [rows, pendingOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((q) => q.id === active.id);
    const newIndex = items.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    const nextIds = next.map((q) => q.id);
    setPendingOrder(nextIds);

    startReorder(async () => {
      setError(null);
      const result = await reorderQuestions({ idsInOrder: nextIds });
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
        setPendingOrder(null);
        return;
      }
      // El refresh trae rows actualizados; soltamos el override.
      setPendingOrder(null);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
          Banco vacío
        </p>
        <h3 className="mt-2 font-display text-2xl text-[var(--color-navy-upao)]">
          No hay preguntas todavía
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
          Crea tu primera pregunta o carga el banco inicial con{" "}
          <code className="rounded bg-[var(--color-paper)] px-1.5 py-0.5">
            pnpm run seed:questions
          </code>
          .
        </p>
        <div className="mt-6">
          <Link href="/admin/preguntas/nueva">
            <Button>Crear pregunta</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/10 px-3 py-2 text-sm text-[var(--color-coral-pulse)]">
          {error}
        </p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
            {items.map((q) => (
              <SortableRow key={q.id} q={q} disabled={pendingReorder} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {pendingReorder ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">Guardando orden…</p>
      ) : null}
    </div>
  );
}

function SortableRow({ q, disabled }: { q: QuestionRow; disabled: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: q.id,
  });
  const [pending, startTransition] = useTransition();

  // useOptimistic actualiza el visual mientras la mutación corre en
  // transición. Cuando `q.activo` (prop) cambie tras router.refresh, el
  // valor base se sincroniza sin necesidad de useEffect.
  const [optimisticActive, setOptimisticActive] = useOptimistic(q.activo);

  function handleToggle() {
    const nextActive = !optimisticActive;
    startTransition(async () => {
      setOptimisticActive(nextActive);
      const result = await toggleQuestionActive({ id: q.id, active: nextActive });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  } as React.CSSProperties;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 px-3 py-4 sm:gap-4 sm:px-5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
        className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-navy-upao)] disabled:opacity-40"
        disabled={disabled}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em]">
          <span className="font-mono text-[var(--color-graphite)]">#{q.orden}</span>
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.18em] text-[var(--color-paper)]"
            style={{ backgroundColor: DIMENSION_TINT[q.dimension_tematica] }}
          >
            {DIMENSION_LABEL[q.dimension_tematica]}
          </span>
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.18em] text-[var(--color-graphite)]">
            {QUESTION_TYPE_LABEL[q.tipo]}
          </span>
          {!optimisticActive ? (
            <span className="rounded-full bg-[var(--color-paper)] px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.18em] text-[var(--color-graphite)]">
              Inactiva
            </span>
          ) : null}
        </div>
        <p
          className={`max-w-3xl text-sm leading-relaxed ${
            optimisticActive
              ? "text-[var(--color-ink)]"
              : "text-[var(--color-muted-foreground)] line-through decoration-[var(--color-muted-foreground)]/40"
          }`}
        >
          {q.enunciado}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleToggle}
          disabled={pending}
          aria-label={optimisticActive ? "Desactivar pregunta" : "Activar pregunta"}
          title={optimisticActive ? "Desactivar" : "Activar"}
        >
          {optimisticActive ? <EyeOff /> : <Eye />}
        </Button>
        <Link
          href={`/admin/preguntas/${q.id}`}
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-navy-upao)]"
          aria-label="Editar pregunta"
        >
          <Pencil className="size-3.5" />
        </Link>
      </div>
    </li>
  );
}
