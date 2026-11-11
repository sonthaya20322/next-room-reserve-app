import { prisma } from "@/lib/db/prisma";
import { badRequest, notFound } from "@/lib/http/errors";
import { jsonError, jsonOk } from "@/lib/http/response";
import {
  requireDateTime,
  requirePositiveInt,
} from "@/lib/validation/parse";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomIdRaw = searchParams.get("roomId");
    const beforeRaw = searchParams.get("before");

    if (!roomIdRaw || !beforeRaw) {
      throw badRequest("ต้องส่ง roomId และ before");
    }

    const roomId = requirePositiveInt(roomIdRaw, "roomId");
    const before = requireDateTime(beforeRaw, "before");
    const now = new Date();
    if (before > now) {
      throw badRequest("before ต้องไม่เกินเวลาปัจจุบัน");
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw notFound("ไม่พบห้องประชุม", { roomId });

    const result = await prisma.booking.deleteMany({
      where: {
        roomId,
        endTime: { lt: before },
      },
    });

    return jsonOk({ deleted: result.count });
  } catch (error) {
    return jsonError(error);
  }
}
