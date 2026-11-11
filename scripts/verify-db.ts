import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  });
  const prisma = new PrismaClient({ adapter });
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
