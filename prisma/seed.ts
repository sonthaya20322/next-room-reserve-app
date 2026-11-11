import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.room.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} room(s) already exist`);
    return;
  }

  await prisma.room.createMany({
    data: [
      {
        roomCode: "A101",
        roomName: "ห้องประชุมใหญ่",
        capacity: 20,
        location: "อาคาร A ชั้น 1",
      },
      {
        roomCode: "B202",
        roomName: "ห้องประชุมเล็ก",
        capacity: 8,
        location: "อาคาร B ชั้น 2",
      },
    ],
  });

  console.log("Seeded 2 rooms");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
