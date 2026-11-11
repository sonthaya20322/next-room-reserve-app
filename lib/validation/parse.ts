import { badRequest } from "@/lib/http/errors";
import { FIELD_LIMITS, type LimitedField } from "./limits";

export function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest("เนื้อหาคำขอต้องเป็น JSON object");
  }
  return value as Record<string, unknown>;
}

export function requireNonEmptyString(
  value: unknown,
  field: string,
  maxLength?: number,
): string {
  if (typeof value !== "string") {
    throw badRequest(`${field} ต้องเป็นข้อความ`, { field });
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw badRequest(`${field} ห้ามว่าง`, { field });
  }
  const limit = maxLength ?? FIELD_LIMITS[field as LimitedField];
  if (typeof limit === "number" && trimmed.length > limit) {
    throw badRequest(`${field} ยาวเกิน ${limit} ตัวอักษร`, {
      field,
      maxLength: limit,
    });
  }
  return trimmed;
}

/** Body PATCH: missing key = omit; null/invalid = 400 */
export function optionalBodyString(
  body: Record<string, unknown>,
  field: string,
  maxLength?: number,
): string | undefined {
  if (!(field in body)) return undefined;
  return requireNonEmptyString(body[field], field, maxLength);
}

export function optionalNonEmptyString(
  value: unknown,
  field: string,
  maxLength?: number,
): string | undefined {
  if (value === undefined) return undefined;
  return requireNonEmptyString(value, field, maxLength);
}

export function requirePositiveInt(value: unknown, field: string): number {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isInteger(num) || num <= 0) {
    throw badRequest(`${field} ต้องเป็นจำนวนเต็มมากกว่า 0`, { field });
  }
  return num;
}

/** Query string helper: null/"" = omit */
export function optionalPositiveInt(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requirePositiveInt(value, field);
}

/** Body PATCH: missing key = omit; null/""/invalid = 400 */
export function optionalBodyPositiveInt(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  if (!(field in body)) return undefined;
  return requirePositiveInt(body[field], field);
}

export function requireDateTime(value: unknown, field: string): Date {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${field} ต้องเป็นวันเวลา ISO-8601`, { field });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${field} ไม่ใช่วันเวลาที่ถูกต้อง`, { field });
  }
  return date;
}

export function optionalDateTime(
  value: unknown,
  field: string,
): Date | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") {
    throw badRequest(`${field} ต้องเป็นวันเวลา ISO-8601`, { field });
  }
  return requireDateTime(value, field);
}

export function optionalBodyDateTime(
  body: Record<string, unknown>,
  field: string,
): Date | undefined {
  if (!(field in body)) return undefined;
  return optionalDateTime(body[field], field);
}

export function requireIdParam(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("id ต้องเป็นจำนวนเต็มมากกว่า 0", { field: "id" });
  }
  return id;
}

export function parsePairDateRange(
  fromRaw: string | null,
  toRaw: string | null,
  options?: { required?: boolean; fromLabel?: string; toLabel?: string },
): { from: Date; to: Date } | null {
  const fromLabel = options?.fromLabel ?? "from";
  const toLabel = options?.toLabel ?? "to";
  const hasFrom = fromRaw !== null && fromRaw !== "";
  const hasTo = toRaw !== null && toRaw !== "";

  if (!hasFrom && !hasTo) {
    if (options?.required) {
      throw badRequest(`ต้องส่ง ${fromLabel} และ ${toLabel}`);
    }
    return null;
  }

  if (hasFrom !== hasTo) {
    throw badRequest(`ต้องส่ง ${fromLabel} และ ${toLabel} ทั้งคู่หรือไม่ส่งเลย`);
  }

  const from = requireDateTime(fromRaw, fromLabel);
  const to = requireDateTime(toRaw, toLabel);
  if (!(from < to)) {
    throw badRequest(`${fromLabel} ต้องน้อยกว่า ${toLabel}`);
  }
  return { from, to };
}

export function parsePagination(
  pageRaw: string | null,
  pageSizeRaw: string | null,
): { page: number; pageSize: number } {
  const page =
    pageRaw === null || pageRaw === ""
      ? 1
      : requirePositiveInt(pageRaw, "page");
  const pageSize =
    pageSizeRaw === null || pageSizeRaw === ""
      ? 10
      : requirePositiveInt(pageSizeRaw, "pageSize");

  if (pageSize > 50) {
    throw badRequest("pageSize ต้องไม่เกิน 50", { field: "pageSize" });
  }

  return { page, pageSize };
}

export function parseDaysParam(raw: string | null): number {
  if (raw === null || raw === "") return 7;
  const days = requirePositiveInt(raw, "days");
  if (days > 30) {
    throw badRequest("days ต้องอยู่ระหว่าง 1–30", { field: "days" });
  }
  return days;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest("เนื้อหาคำขอต้องเป็น JSON ที่ถูกต้อง");
  }
}
