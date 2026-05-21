/**
 * Verificación server-side de Cloudflare Turnstile (FR-038).
 *
 * Llamado desde server actions sensibles (login, submitPreference) con el
 * token recibido del widget. Si Turnstile no está configurado (sin secret en
 * env), permite siempre — sirve para dev/CI sin cuenta de Cloudflare.
 */

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Modo permisivo en dev/CI sin Turnstile configurado.
    return { success: true };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Timeout defensivo — Cloudflare suele responder en <500ms.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { success: false, errorCodes: [`http-${res.status}`] };
    }

    const data = (await res.json()) as TurnstileVerifyResponse;
    return {
      success: data.success,
      errorCodes: data["error-codes"],
    };
  } catch {
    return { success: false, errorCodes: ["network-error"] };
  }
}
