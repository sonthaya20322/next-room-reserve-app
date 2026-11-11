export type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: unknown };
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: body.error?.message ?? `คำขอล้มเหลว (${response.status})`,
    };
  }
  return { ok: true, data: body as T };
}

export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseLocalInput(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function localInputToIso(value: string) {
  const date = parseLocalInput(value);
  if (!date) {
    throw new Error("วันเวลาไม่ถูกต้อง");
  }
  return date.toISOString();
}

export function assertFutureBookingWindow(
  startLocal: string,
  endLocal: string,
): { start: Date; end: Date } | { error: string } {
  const start = parseLocalInput(startLocal);
  const end = parseLocalInput(endLocal);
  if (!start || !end) {
    return { error: "กรอกวันเวลาเริ่มและสิ้นสุดให้ครบและถูกต้อง" };
  }
  if (!(start < end)) {
    return { error: "เวลาเริ่มต้องมาก่อนเวลาสิ้นสุด" };
  }
  if (!(start > new Date())) {
    return { error: "จองได้เฉพาะช่วงเวลาในอนาคตเท่านั้น" };
  }
  return { start, end };
}
