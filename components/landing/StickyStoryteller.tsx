"use client";

import { useEffect, useRef, useState } from "react";

export interface Step {
  n: string;
  kicker: string;
  title: string;
  body: string;
}

/**
 * Sticky scroll storyteller — la columna izquierda se queda fija con el
 * número/título del paso activo mientras el lector scrollea la columna
 * derecha con el detalle. Detecta el paso visible vía IntersectionObserver
 * y resalta su número en la izquierda.
 *
 * Layout responsive:
 *  - Mobile: stack vertical sin sticky. Cada paso ocupa su altura natural.
 *  - Desktop (lg+): layout 5/7 con la columna izquierda sticky.
 */
export function StickyStoryteller({ steps }: { steps: Step[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-step-index"));
            if (Number.isFinite(idx)) setActiveIndex(idx);
          }
        }
      },
      {
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      },
    );

    for (const el of refs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const active = steps[activeIndex];

  return (
    <section className="border-b border-[var(--color-border)] py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
        {/* Columna sticky con el paso activo */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-32 space-y-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Paso · {activeIndex + 1} de {steps.length}
            </p>
            <p
              key={`n-${activeIndex}`}
              className="font-mono text-[6rem] leading-none text-[var(--color-cyan-deep)] transition-opacity duration-500"
            >
              {active?.n}
            </p>
            <p
              key={`t-${activeIndex}`}
              className="font-display text-3xl leading-tight tracking-tight text-[var(--color-navy-upao)] sm:text-4xl"
            >
              {active?.title}
            </p>
            {/* Indicador de progreso */}
            <ol className="space-y-2 pt-4">
              {steps.map((s, i) => (
                <li
                  key={s.n}
                  className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.18em]"
                  aria-current={i === activeIndex ? "step" : undefined}
                >
                  <span
                    className={`block h-px transition-all ${
                      i === activeIndex
                        ? "w-10 bg-[var(--color-navy-upao)]"
                        : "w-5 bg-[var(--color-border)]"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={
                      i === activeIndex
                        ? "text-[var(--color-navy-upao)]"
                        : "text-[var(--color-muted-foreground)]"
                    }
                  >
                    {s.n} · {s.kicker}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Columna scrolleable con el detalle */}
        <ol className="space-y-24 lg:col-span-7 lg:space-y-40">
          {steps.map((step, i) => (
            <li
              key={step.n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step-index={i}
              className="space-y-4"
            >
              {/* En móvil sí mostramos el header del paso; en desktop ya está en el sticky */}
              <div className="space-y-2 lg:hidden">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-cyan-deep)]">
                  {step.n} · {step.kicker}
                </p>
                <h3 className="font-display text-2xl leading-tight text-[var(--color-navy-upao)] sm:text-3xl">
                  {step.title}
                </h3>
              </div>
              <p className="text-base leading-relaxed text-[var(--color-graphite)] sm:text-lg">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
