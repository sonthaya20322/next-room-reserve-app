export function jsonRequest(
  url: string,
  method: string,
  body?: unknown,
): Request {
  return new Request(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function readJson(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  };
}

export function futureIso(hoursFromNow: number, durationHours = 1) {
  const start = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

export function uniqueCode(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
