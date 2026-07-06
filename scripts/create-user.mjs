// Bootstraps a dispatcher login. There is no signup UI by design (see
// README "Auth" section) - run this once per dispatcher who needs access.
// Usage: npm run db:create-user -- <email> <password> [name]
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error("Usage: npm run db:create-user -- <email> <password> [name]");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash, name: name ?? undefined },
  create: { email, passwordHash, name: name ?? undefined },
});

console.log(`User ready: ${user.email} (id: ${user.id})`);
await prisma.$disconnect();
