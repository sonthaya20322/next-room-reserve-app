import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const rooms = await prisma.room.findMany({ orderBy: { id: "asc" } });
    console.log(`ROOM_COUNT=${rooms.length}`);
    for (const room of rooms) {
      console.log(`${room.id} ${room.roomCode} ${room.roomName} cap=${room.capacity}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
