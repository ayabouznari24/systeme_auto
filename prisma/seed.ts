import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "you@example.com";
  const password = process.env.SEED_USER_PASSWORD ?? "changeme123";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Owner",
      passwordHash,
      notificationSettings: {
        create: {
          desktopEnabled: true,
          emailEnabled: false,
          minPriorityScore: 80,
        },
      },
    },
  });

  console.log(`Seeded user ${user.email} (id: ${user.id}).`);
  console.log(
    process.env.SEED_USER_PASSWORD
      ? "Login with the SEED_USER_PASSWORD you provided."
      : `Default password is "changeme123" - change it after first login.`
  );

  for (const name of ["Recruteur", "Client", "Facture", "Contrat", "RDV"]) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
