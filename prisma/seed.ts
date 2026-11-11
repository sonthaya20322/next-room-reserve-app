import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

function createPrisma() {
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
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

function atDay(daysFromNow: number, hour: number, minute = 0) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();

  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        roomCode: "A101",
        roomName: "ห้องประชุมใหญ่",
        capacity: 24,
        location: "อาคาร A ชั้น 1",
      },
    }),
    prisma.room.create({
      data: {
        roomCode: "A203",
        roomName: "ห้องบอร์ดมีตติ้ง",
        capacity: 12,
        location: "อาคาร A ชั้น 2",
      },
    }),
    prisma.room.create({
      data: {
        roomCode: "B105",
        roomName: "ห้องประชุมทีม",
        capacity: 8,
        location: "อาคาร B ชั้น 1",
      },
    }),
    prisma.room.create({
      data: {
        roomCode: "B210",
        roomName: "ห้องอบรม",
        capacity: 40,
        location: "อาคาร B ชั้น 2",
      },
    }),
    prisma.room.create({
      data: {
        roomCode: "C301",
        roomName: "ห้องสัมภาษณ์",
        capacity: 4,
        location: "อาคาร C ชั้น 3",
      },
    }),
  ]);

  const [a101, a203, b105, b210, c301] = rooms;

  await prisma.booking.createMany({
    data: [
      {
        roomId: a101.id,
        bookerName: "วิภาดา สุขใจ",
        purpose: "ประชุมวางแผนไตรมาส",
        attendeeCount: 18,
        startTime: atDay(-2, 9),
        endTime: atDay(-2, 11),
      },
      {
        roomId: b105.id,
        bookerName: "ธนพล รุ่งเรือง",
        purpose: "สแตนด์อัพทีมพัฒนา",
        attendeeCount: 6,
        startTime: atDay(-1, 10),
        endTime: atDay(-1, 10, 30),
      },
      {
        roomId: a203.id,
        bookerName: "กมลชนก พิทักษ์",
        purpose: "ประชุมผู้บริหาร",
        attendeeCount: 10,
        startTime: atDay(0, 13),
        endTime: atDay(0, 15),
      },
      {
        roomId: c301.id,
        bookerName: "อริสา ใจดี",
        purpose: "สัมภาษณ์ผู้สมัครงาน",
        attendeeCount: 3,
        startTime: atDay(1, 10),
        endTime: atDay(1, 11),
      },
      {
        roomId: b210.id,
        bookerName: "สมชาย วัฒนา",
        purpose: "อบรมความปลอดภัยในองค์กร",
        attendeeCount: 32,
        startTime: atDay(2, 9),
        endTime: atDay(2, 12),
      },
      {
        roomId: a101.id,
        bookerName: "นฤมล ศรีสุข",
        purpose: "ประชุมลูกค้าประจำเดือน",
        attendeeCount: 15,
        startTime: atDay(3, 14),
        endTime: atDay(3, 16),
      },
      {
        roomId: b105.id,
        bookerName: "ปิยะพงษ์ แสงทอง",
        purpose: "ทบทวนงานโครงการ",
        attendeeCount: 7,
        startTime: atDay(5, 11),
        endTime: atDay(5, 12, 30),
      },
      {
        roomId: a203.id,
        bookerName: "ชลธิชา อรุณ",
        purpose: "เวิร์กช็อปออกแบบบริการ",
        attendeeCount: 11,
        startTime: atDay(6, 9, 30),
        endTime: atDay(6, 12),
      },
    ],
  });

  console.log(`Seeded ${rooms.length} rooms and 8 bookings`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
