"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { refreshJneNow } from "@/app/(admin)/admin/jne/_actions";
import { ERROR_MESSAGES } from "@/lib/errors";

export function JneRefreshPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    | { kind: "success"; text: string }
    | { kind: "error"; text: string }
    | { kind: "warning"; text: string }
    | null
  >(null);

  function handleRefresh() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshJneNow();
      if (!result.ok) {
        setMessage({
          kind: "error",
          text:
            result.error.code === "ValidationError"
              ? result.error.message
              : ERROR_MESSAGES[result.error.code],
        });
        return;
      }
      const inner = result.value;
      if (inner.ok) {
        setMessage({
          kind: "success",
          text: `Refresh OK · ${inner.summary.candidatesUpdated} candidatos · ${inner.summary.dimensionsUpdated} dimensiones · ${Math.round(inner.summary.durationMs / 100) / 10}s`,
        });
      } else {
        setMessage({
          kind: inner.partial ? "warning" : "error",
          text: `${inner.error.code}: ${inner.error.message}`,
        });
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleRefresh} disabled={pending} size="lg">
        <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
        {pending ? "Refrescando..." : "Refrescar ahora"}
      </Button>

      {message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            message.kind === "success"
              ? "border-[var(--color-mint-success)]/40 bg-[var(--color-mint-success)]/10 text-[var(--color-mint-success)]"
              : message.kind === "warning"
                ? "border-[var(--color-mango-sun)]/40 bg-[var(--color-mango-sun)]/10 text-[var(--color-mango-sun)]"
                : "border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/10 text-[var(--color-coral-pulse)]"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
