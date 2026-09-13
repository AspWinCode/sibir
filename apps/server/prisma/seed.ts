import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: "+70000000000" },
    update: {},
    create: { phone: "+70000000000", name: "Администратор", role: "ADMIN" },
  });

  const blueberry = await prisma.rawMaterial.upsert({
    where: { name: "Черника" },
    update: {},
    create: {
      name: "Черника",
      composition: "Витамины C, K, антоцианы",
      benefits: "Улучшает зрение, антиоксидант",
      seasonStart: "Июль",
      seasonEnd: "Август",
      harvestGuide: "Собирать вручную, без веток и листьев",
      gostReference: "ГОСТ 33823-2016",
    },
  });

  const wildGarlic = await prisma.rawMaterial.upsert({
    where: { name: "Черемша" },
    update: {},
    create: {
      name: "Черемша",
      composition: "Витамин C, эфирные масла",
      benefits: "Природный антисептик",
      seasonStart: "Май",
      seasonEnd: "Июнь",
      harvestGuide: "Срезать ножом у основания, не выдёргивать с корнем",
      gostReference: "ГОСТ Р 55904-2013",
    },
  });

  const region = await prisma.region.create({
    data: { name: "Слюдянский район", district: "Иркутская область" },
  });

  const field = await prisma.field.create({
    data: {
      name: "Падь сухая",
      latitude: 52.3471,
      longitude: 104.47753,
      hasRoute: true,
      regionId: region.id,
      rawMaterialId: blueberry.id,
    },
  });

  await prisma.route.create({
    data: {
      name: "Маршрут до Пади сухой",
      fieldId: field.id,
      regionId: region.id,
      distanceKm: 5,
      durationMin: 60,
    },
  });

  const procurement = await prisma.user.upsert({
    where: { phone: "+79021882222" },
    update: {},
    create: {
      phone: "+79021882222",
      name: "Иванов ИП",
      role: "PROCUREMENT",
      orgName: 'ИП Иванов',
      inn: "381100000000",
      email: "ivanov@example.com",
    },
  });

  const point = await prisma.procurementPoint.create({
    data: {
      ownerId: procurement.id,
      name: "Иванов ИП",
      address: "г. Слюдянка, Ленина, 6",
      phone: "8-902-188-22-22",
      workingHours: "С 14 до 20 ежедневно, в остальное время по предварительной заявке",
      type: "STATIONARY",
      regionId: region.id,
      latitude: 51.6663,
      longitude: 103.7204,
    },
  });

  await prisma.purchasePlan.createMany({
    data: [
      { procurementPointId: point.id, rawMaterialId: blueberry.id, volumeKg: 1000, pricePerKg: 160 },
      { procurementPointId: point.id, rawMaterialId: wildGarlic.id, volumeKg: 300, pricePerKg: 90 },
    ],
  });

  await prisma.fireSafetyTest.create({
    data: {
      title: "Пожарная безопасность в лесу",
      questions: {
        create: [
          {
            text: "Можно ли разводить костёр в сухую ветреную погоду?",
            options: ["Да", "Нет", "Только с разрешения"],
            correctIndex: 1,
            order: 0,
          },
        ],
      },
    },
  });

  console.log("Seed complete:", { admin: admin.phone, procurement: procurement.phone });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
