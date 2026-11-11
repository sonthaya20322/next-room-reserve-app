import type { Prisma } from "@prisma/client";

/** Lock Room row for the rest of the interactive transaction (MySQL FOR UPDATE). */
export async function lockRoomForUpdate(
  tx: Prisma.TransactionClient,
  roomId: number,
) {
  await tx.$executeRaw`SELECT id FROM Room WHERE id = ${roomId} FOR UPDATE`;
}
