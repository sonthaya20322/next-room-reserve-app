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

export function localInputToIso(value: string) {
  return new Date(value).toISOString();
}
