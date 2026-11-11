import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { conflict } from "@/lib/http/errors";
import { getSearchParams } from "@/lib/http/request";
import { jsonCreated, jsonError, jsonOk } from "@/lib/http/response";
import { FIELD_LIMITS } from "@/lib/validation/limits";
import {
  asRecord,
  optionalPositiveInt,
  readJsonBody,
  requireNonEmptyString,
  requirePositiveInt,
} from "@/lib/validation/parse";

export async function GET(request: Request) {
  const searchParams = getSearchParams(request);
  try {
    const search = searchParams.get("search")?.trim() || undefined;
    const minCapacity = optionalPositiveInt(
      searchParams.get("minCapacity"),
      "minCapacity",
    );

    const where: Prisma.RoomWhereInput = {};
    if (search) {
      where.OR = [
        { roomName: { contains: search } },
        { location: { contains: search } },
      ];
    }
    if (minCapacity !== undefined) {
      where.capacity = { gte: minCapacity };
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { id: "asc" },
    });
    return jsonOk({ data: rooms });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = asRecord(await readJsonBody(request));
    const roomCode = requireNonEmptyString(
      body.roomCode,
      "roomCode",
      FIELD_LIMITS.roomCode,
    );
    const roomName = requireNonEmptyString(
      body.roomName,
      "roomName",
      FIELD_LIMITS.roomName,
    );
    const location = requireNonEmptyString(
      body.location,
      "location",
      FIELD_LIMITS.location,
    );
    const capacity = requirePositiveInt(body.capacity, "capacity");

    const existing = await prisma.room.findUnique({ where: { roomCode } });
    if (existing) {
      throw conflict("รหัสห้องซ้ำ", { roomCode });
    }

    const room = await prisma.room.create({
      data: { roomCode, roomName, location, capacity },
    });
    return jsonCreated(room);
  } catch (error) {
    return jsonError(error);
  }
}
