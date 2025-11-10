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

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== Role.ADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: Role.ADMIN, isVerified: true },
      });
      console.log("Updated existing admin user permissions.");
    } else {
      console.log("Admin user already exists. Nothing to do.");
    }
    return;
  }

  await prisma.user.create({
    data: {
      email,
      username,
      displayName: "Platform Admin",
      passwordHash,
      isVerified: true,
      role: Role.ADMIN,
      bio: "Runs the platform and keeps the vibes healthy.",
    },
  });

  console.log(`Created admin user (${email}).`);
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
