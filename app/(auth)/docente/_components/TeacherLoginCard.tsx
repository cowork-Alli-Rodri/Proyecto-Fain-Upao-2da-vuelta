"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

/**
 * Card de acceso del docente. A diferencia del LoginCard general:
 *  - Sin proveedores OAuth (los docentes usan correo institucional + contraseña).
 *  - Sin opción "Crear cuenta" — el docente NO debe registrarse aquí; debe
 *    haber sido habilitado por la administración primero. Si no está en la
 *    whitelist, su cuenta nueva queda como student y no podrá acceder al
 *    dashboard.
 *  - Si ya hay una sesión de estudiante activa, ofrece cerrarla.
 */
export function TeacherLoginCard({
  currentUserEmail,
  currentRole,
}: {
  currentUserEmail: string | null;
  currentRole: "student" | "teacher" | "admin" | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.reload();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      // El callback /auth/callback decide el destino según el rol.
      // Si el correo NO está habilitado como docente, será student y el
      // middleware lo enviará al flujo de estudiante. Aquí asumimos rol válido.
      window.location.href = "/auth/callback?next=/dashboard";
    });
  }

  // Estudiante con sesión activa → no puede usar este acceso.
  if (currentUserEmail && currentRole === "student") {
    return (
      <div className="space-y-5 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-coral-pulse)]">
          Acceso no autorizado
        </p>
        <h2 className="font-display text-2xl text-[var(--color-navy-upao)]">
          Tu cuenta no tiene permisos de docente.
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-graphite)]">
          Estás conectado como{" "}
          <strong className="font-mono">{currentUserEmail}</strong>, una cuenta
          de estudiante. Para acceder al panel del curso necesitas un correo
          habilitado por la administración.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--color-navy-upao)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
          >
            {pending ? "Cerrando..." : "Cerrar sesión"}
          </button>
          <Link
            href="/cuestionario"
            className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-graphite)] underline-offset-4 hover:text-[var(--color-navy-upao)] hover:underline"
          >
            Volver a mi flujo de estudiante →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Correo institucional
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="docente@upao.edu.pe"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          className="h-12 bg-[var(--color-surface)]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
          className="h-12 bg-[var(--color-surface)]"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 px-4 py-3 text-sm text-[var(--color-coral-pulse)]"
        >
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-lg border border-[var(--color-mint-success)]/40 bg-[var(--color-mint-success)]/5 px-4 py-3 text-sm text-[oklch(40%_0.12_168)]">
          {info}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy-upao)] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
      >
        {pending ? "Ingresando..." : "Ingresar al panel"}
        <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </button>

      <p className="border-t border-[var(--color-border)] pt-4 text-center text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        ¿Aún no tienes credenciales como docente? Contacta a la administración
        del curso para que tu correo sea habilitado.
      </p>
    </form>
  );
}
