/**
 * Error taxonomy compartida por server actions y route handlers.
 * Toda mutación devuelve Result<T, AppError> — el cliente decide cómo
 * presentar (toast, inline error, redirect).
 *
 * Detalle en contracts/server-actions.md.
 */

export type UserRole = "student" | "teacher" | "admin";

export type AppError =
  | { code: "ValidationError"; field: string; message: string }
  | { code: "ConsentMissing" }
  | { code: "MissingAnswers"; questionIds: string[] }
  | { code: "QuestionnaireIncomplete" }
  | { code: "AlreadySubmitted" }
  | { code: "RateLimited"; retryAfterSec: number }
  | { code: "TurnstileFailed" }
  | { code: "ForbiddenRole"; required: UserRole }
  | { code: "Unauthenticated" }
  | { code: "NotFound"; entity: string }
  | { code: "Unexpected"; correlationId: string };

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E extends AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isAppError(e: unknown): e is AppError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  );
}

// Mensajes legibles para mostrar al usuario.
// Constitución VI: nunca "Error 500" genérico — siempre mensaje contextual.
export const ERROR_MESSAGES: Record<AppError["code"], string> = {
  ValidationError: "Hay un campo inválido. Revisa el formulario.",
  ConsentMissing: "Debes aceptar el consentimiento y autorizar el uso de tus datos para continuar.",
  MissingAnswers: "Aún te faltan responder algunas preguntas.",
  QuestionnaireIncomplete: "Termina el cuestionario antes de declarar tu preferencia.",
  AlreadySubmitted: "Tu preferencia ya quedó registrada y es final.",
  RateLimited: "Demasiados intentos. Espera unos segundos.",
  TurnstileFailed: "No pudimos verificar que no eres un bot. Recarga la página.",
  ForbiddenRole: "No tienes permisos para acceder a esta sección.",
  Unauthenticated: "Inicia sesión para continuar.",
  NotFound: "No encontramos lo que buscas.",
  Unexpected: "Algo salió mal. Si el problema persiste, contacta al docente del curso.",
};
