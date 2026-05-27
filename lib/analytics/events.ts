/**
 * Catálogo de eventos PostHog (FR-039: cero PII).
 * Todos los eventos se emiten con `opaque_user_id` (hash) — NO con el UUID real.
 */

export const ANALYTICS_EVENTS = {
  // Auth flow
  LOGIN_VIEWED: "login_viewed",
  LOGIN_SUCCEEDED: "login_succeeded",
  LOGIN_FAILED: "login_failed",
  CONSENT_VIEWED: "consent_viewed",
  CONSENT_ACCEPTED: "consent_accepted",
  PROFILE_COMPLETED: "profile_completed",

  // Questionnaire
  QUESTIONNAIRE_STARTED: "questionnaire_started",
  QUESTIONNAIRE_STEP_ADVANCED: "questionnaire_step_advanced",
  QUESTIONNAIRE_COMPLETED: "questionnaire_completed",

  // Preference
  PREFERENCE_FORM_OPENED: "preference_form_opened",
  PREFERENCE_SUBMITTED: "preference_submitted",

  // Teacher/admin
  DASHBOARD_VIEWED: "dashboard_viewed",
  DASHBOARD_FILTER_APPLIED: "dashboard_filter_applied",
  DASHBOARD_EXPORT: "dashboard_export",
  ADMIN_QUESTION_EDITED: "admin_question_edited",
  ADMIN_JNE_REFRESH_TRIGGERED: "admin_jne_refresh_triggered",

  // Compliance
  ANONYMIZATION_RUN: "anonymization_run",
  DATA_DELETION_REQUESTED: "data_deletion_requested",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
