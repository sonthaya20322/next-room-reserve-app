import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "เกิดข้อผิดพลาดภายในระบบ",
      },
    },
    { status: 500 },
  );
}
