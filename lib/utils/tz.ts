import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

export const LIMA_TZ = "America/Lima";

/**
 * Convierte una fecha (Date, ISO string, o dayjs) a la zona horaria de Lima.
 */
export function toLima(input: string | Date | dayjs.Dayjs) {
  return dayjs(input).tz(LIMA_TZ);
}

/**
 * Formato corto para UI: "20 may 2026, 15:30".
 */
export function formatLimaShort(input: string | Date | dayjs.Dayjs): string {
  return toLima(input).format("DD MMM YYYY, HH:mm");
}

/**
 * ISO con offset Lima: "2026-05-20T15:30:00-05:00".
 */
export function isoLima(input: string | Date | dayjs.Dayjs): string {
  return toLima(input).format();
}

/**
 * "Hace 3 minutos" relativo desde ahora.
 */
export function fromNowLima(input: string | Date | dayjs.Dayjs): string {
  const delta = dayjs(input).diff(dayjs(), "second");
  const absSec = Math.abs(delta);
  if (absSec < 60) return delta < 0 ? "hace un momento" : "en un momento";
  const min = Math.round(absSec / 60);
  if (min < 60) return delta < 0 ? `hace ${min} min` : `en ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return delta < 0 ? `hace ${hr} h` : `en ${hr} h`;
  const days = Math.round(hr / 24);
  return delta < 0 ? `hace ${days} d` : `en ${days} d`;
}
