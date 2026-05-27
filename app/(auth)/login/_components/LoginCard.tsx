"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

export function LoginCard({
  nextPath,
  initialError,
  initialNotice = null,
}: {
  nextPath: string;
  initialError: string | null;
  initialNotice?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(initialNotice);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  function handleOAuth(provider: "google") {
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
        const emailRedirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
            : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (error) {
          setError(error.message);
          return;
        }
        setInfo(
          "Cuenta creada. Te enviamos un correo de confirmación — al hacer click en el enlace vuelves directo al siguiente paso del flujo.",
        );
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
      </div>

      {/* Separador */}
      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="px-4 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          o con correo
        </span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      {/* Segmented control: Ingresar / Crear cuenta */}
      <div
        role="tablist"
        aria-label="Tipo de acceso"
        className="relative grid grid-cols-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-paper)] p-1"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-[var(--color-navy-upao)] shadow-[var(--shadow-soft)]"
          style={{ left: mode === "signin" ? "0.25rem" : "calc(50% + 0rem)" }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => {
            setMode("signin");
            setError(null);
            setInfo(null);
          }}
          className={`relative z-10 py-2.5 text-sm font-medium transition-colors ${
            mode === "signin"
              ? "text-white"
              : "text-[var(--color-graphite)] hover:text-[var(--color-navy-upao)]"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
          className={`relative z-10 py-2.5 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "text-white"
              : "text-[var(--color-graphite)] hover:text-[var(--color-navy-upao)]"
          }`}
        >
          Crear cuenta
        </button>
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
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--color-navy-upao)] px-5 py-4 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={pending ? "pending" : mode}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2"
            >
              {pending
                ? "Procesando..."
                : mode === "signin"
                  ? "Ingresar"
                  : "Crear cuenta"}
              <span
                aria-hidden
                className="inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </motion.span>
          </AnimatePresence>
        </button>
      </form>

      <p className="text-center text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        Al ingresar aceptas que tus datos se usen con fines académicos y se
        protejan según se explica en el consentimiento.
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

