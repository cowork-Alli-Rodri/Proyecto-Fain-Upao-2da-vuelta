export function EmptyState() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="space-y-4">
          <p className="editorial-kicker">Sin datos aún</p>
          <h2 className="font-display text-3xl font-medium text-[var(--color-navy-upao)] sm:text-4xl">
            Esperando las primeras respuestas
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-graphite)]">
            Aún no hay estudiantes que cumplan los filtros seleccionados. Compárteles el link
            del cuestionario o ajusta los filtros para ver más datos.
          </p>
        </div>
      </div>
    </section>
  );
}
