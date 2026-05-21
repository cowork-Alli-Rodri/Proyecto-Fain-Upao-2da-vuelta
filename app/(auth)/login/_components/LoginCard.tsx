"use client";

import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

export function LoginCard({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  function handleOAuth(provider: "google" | "azure") {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : "/auth/callback";
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) setError(error.message);
    });
  }

  function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        window.location.href = "/auth/callback?next=" + encodeURIComponent(nextPath);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        setInfo("Cuenta creada. Si tu correo requiere confirmación, revisa tu bandeja.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* OAuth providers */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => handleOAuth("google")}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-4 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-navy-upao)] hover:shadow-[var(--shadow-soft)] disabled:opacity-50"
        >
          <GoogleIcon />
          Continuar con Google
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => handleOAuth("azure")}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-4 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-navy-upao)] hover:shadow-[var(--shadow-soft)] disabled:opacity-50"
        >
          <MicrosoftIcon />
          Continuar con Microsoft
        </button>
      </div>

      {/* Separador */}
      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="px-4 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          o con correo
        </span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      {/* Email + password */}
      <form onSubmit={handleEmailPassword} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Correo
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
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
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
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
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy-upao)] px-5 py-4 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
        >
          {pending ? "Procesando..." : mode === "signin" ? "Ingresar" : "Crear cuenta"}
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setInfo(null);
        }}
        className="block w-full text-center text-sm text-[var(--color-graphite)] underline-offset-4 hover:text-[var(--color-navy-upao)] hover:underline"
      >
        {mode === "signin"
          ? "¿No tienes cuenta? Crear una"
          : "¿Ya tienes cuenta? Ingresar"}
      </button>

      <p className="text-center text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        Al ingresar aceptas el tratamiento académico y anonimizable de tus
        datos personales.
        <br />
        Esta plataforma no emite recomendaciones de voto.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path
        d="M19.6 10.23c0-.71-.06-1.4-.19-2.05H10v3.88h5.39c-.23 1.24-.94 2.29-2 2.99v2.49h3.23c1.89-1.74 2.98-4.31 2.98-7.31z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.23-2.49c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H1.06v2.59C2.71 17.74 6.09 20 10 20z"
        fill="#34A853"
      />
      <path
        d="M4.4 11.91c-.2-.6-.32-1.24-.32-1.91s.12-1.31.32-1.91V5.5H1.06C.39 6.84 0 8.37 0 10s.39 3.16 1.06 4.5l3.34-2.59z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.97c1.47 0 2.79.51 3.83 1.5l2.87-2.87C14.96.98 12.7 0 10 0 6.09 0 2.71 2.26 1.06 5.5L4.4 8.09C5.19 5.73 7.4 3.97 10 3.97z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path d="M0 0h9.5v9.5H0z" fill="#F25022" />
      <path d="M10.5 0H20v9.5h-9.5z" fill="#7FBA00" />
      <path d="M0 10.5h9.5V20H0z" fill="#00A4EF" />
      <path d="M10.5 10.5H20V20h-9.5z" fill="#FFB900" />
    </svg>
  );
}
