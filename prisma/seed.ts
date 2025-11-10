import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !username || !password) {
    throw new Error("ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD must be set.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      bio: "Runs the platform and keeps the vibes healthy.",
    },
    create: {
      email,
      username,
      displayName: "Platform Admin",
      passwordHash,
      isVerified: true,
      role: Role.ADMIN,
      bio: "Runs the platform and keeps the vibes healthy.",
    },
  });

  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        {
          authorId: admin.id,
          imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
          caption: "Sunset meetup with the squad 🌅",
        },
        {
          authorId: admin.id,
          imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
          caption: "Coffee chats + product ideas ☕️",
        },
        {
          authorId: admin.id,
          imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
          caption: "Weekend city strolls hit different 🏙️",
        },
      ],
    });
    console.log("Seeded starter photo posts.");
  }

  console.log(`Admin ready at ${email}.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
