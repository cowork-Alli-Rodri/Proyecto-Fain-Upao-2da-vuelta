"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border-[color-mix(in_oklch,var(--color-navy-upao)_20%,transparent)] shadow-[var(--shadow-fluffy)]">
      <CardHeader>
        <CardTitle className="text-xl">Ingresar</CardTitle>
        <CardDescription className="text-[var(--color-smoke)]">
          Usa tu cuenta institucional UPAO, una cuenta personal, o crea una con tu correo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOAuth("google")}
            className="font-medium"
          >
            Continuar con Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOAuth("azure")}
            className="font-medium"
          >
            Continuar con Microsoft
          </Button>
        </div>

        <div className="relative flex items-center">
          <span className="h-px flex-1 bg-[color-mix(in_oklch,var(--color-smoke)_20%,transparent)]" />
          <span className="px-3 text-xs uppercase tracking-wider text-[var(--color-smoke)]">
            o con correo
          </span>
          <span className="h-px flex-1 bg-[color-mix(in_oklch,var(--color-smoke)_20%,transparent)]" />
        </div>

        <form onSubmit={handleEmailPassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-[var(--color-coral-pulse)]">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-[var(--color-mint-success)]">{info}</p>
          ) : null}

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
          >
            {pending ? "Procesando..." : mode === "signin" ? "Ingresar" : "Crear cuenta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="block w-full text-center text-sm text-[var(--color-smoke)] underline-offset-4 hover:text-[var(--color-navy-upao)] hover:underline"
        >
          {mode === "signin"
            ? "¿No tienes cuenta? Crear una"
            : "¿Ya tienes cuenta? Ingresar"}
        </button>
      </CardContent>
    </Card>
  );
}
