export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new AppError(400, "VALIDATION_ERROR", message, details);
}

export function notFound(message: string, details?: unknown) {
  return new AppError(404, "NOT_FOUND", message, details);
}

export function conflict(message: string, details?: unknown) {
  return new AppError(409, "CONFLICT", message, details);
}
