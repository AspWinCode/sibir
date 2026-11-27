import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const accounts = [
    { phone: "+70000000000", login: "admin", password: "Admin123!", name: "Администратор", role: "ADMIN" as const },
    { phone: "+79021882222", login: "ivanov", password: "Ivanov123!", name: "Иванов ИП", role: "PROCUREMENT" as const },
    { phone: "+70000000001", login: "collector", password: "Collector123!", name: "Тестовый сборщик", role: "COLLECTOR" as const },
  ];

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await prisma.user.upsert({
      where: { phone: account.phone },
      update: { login: account.login, passwordHash, name: account.name, role: account.role },
      create: { phone: account.phone, login: account.login, passwordHash, name: account.name, role: account.role },
    });
  }
  console.log("Lesovik accounts ensured");
}

main().finally(() => prisma.$disconnect());
