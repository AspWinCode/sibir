import { GraphQLScalarType, Kind } from "graphql";
import type { GraphQLContext } from "../context.js";
import { requireUser, requireRole, AuthError } from "../context.js";
import { generateSmsCode, sendSmsCode } from "../lib/sms.js";
import { signAuthToken } from "../lib/auth.js";
import { suggestAddress } from "../lib/dadata.js";
import { getPaymentProvider } from "../lib/payment.js";

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: function parse(ast): unknown {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return Number(ast.value);
      case Kind.OBJECT:
        return Object.fromEntries(ast.fields.map((f) => [f.name.value, parse(f.value)]));
      case Kind.LIST:
        return ast.values.map(parse);
      case Kind.NULL:
        return null;
      default:
        return null;
    }
  },
});

const SMS_CODE_TTL_MINUTES = 5;

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    me: (_: unknown, __: unknown, ctx: GraphQLContext) => ctx.user,

    rawMaterials: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.prisma.rawMaterial.findMany({ orderBy: { name: "asc" } }),
    rawMaterial: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.prisma.rawMaterial.findUnique({ where: { id } }),

    regions: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.prisma.region.findMany({ orderBy: { name: "asc" } }),

    fields: (
      _: unknown,
      { regionId, rawMaterialId }: { regionId?: string; rawMaterialId?: string },
      ctx: GraphQLContext,
    ) =>
      ctx.prisma.field.findMany({
        where: { regionId: regionId ?? undefined, rawMaterialId: rawMaterialId ?? undefined },
      }),
    field: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.prisma.field.findUnique({ where: { id } }),

    routes: (_: unknown, { regionId }: { regionId?: string }, ctx: GraphQLContext) =>
      ctx.prisma.route.findMany({ where: { regionId: regionId ?? undefined } }),

    myStocks: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "COLLECTOR");
      return ctx.prisma.stock.findMany({
        where: { collectorId: user.id },
        orderBy: { collectedAt: "desc" },
      });
    },

    procurementPoints: (_: unknown, { regionId }: { regionId?: string }, ctx: GraphQLContext) =>
      ctx.prisma.procurementPoint.findMany({ where: { regionId: regionId ?? undefined } }),
    procurementPoint: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.prisma.procurementPoint.findUnique({ where: { id } }),
    myProcurementPoints: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      return ctx.prisma.procurementPoint.findMany({ where: { ownerId: user.id } });
    },

    offersForMaterial: async (
      _: unknown,
      {
        rawMaterialId,
        regionId,
        sortBy,
      }: { rawMaterialId: string; regionId?: string; sortBy?: string },
      ctx: GraphQLContext,
    ) => {
      const collector = ctx.user;
      const plans = await ctx.prisma.purchasePlan.findMany({
        where: {
          rawMaterialId,
          procurementPoint: regionId ? { regionId } : undefined,
        },
        include: { procurementPoint: true },
      });

      const offers = plans.map((plan) => {
        let distanceKm: number | null = null;
        if (
          collector &&
          plan.procurementPoint.latitude != null &&
          plan.procurementPoint.longitude != null
        ) {
          // Placeholder origin until the client sends live GPS coordinates through the API.
          distanceKm = null;
        }
        return { procurementPoint: plan.procurementPoint, purchasePlan: plan, distanceKm };
      });

      if (sortBy === "price") {
        offers.sort((a, b) => b.purchasePlan.pricePerKg - a.purchasePlan.pricePerKg);
      } else if (sortBy === "distance") {
        offers.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      }

      return offers;
    },

    myDealsAsCollector: (_: unknown, { status }: { status?: string }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "COLLECTOR");
      return ctx.prisma.deal.findMany({
        where: { collectorId: user.id, status: (status as never) ?? undefined },
        orderBy: { createdAt: "desc" },
      });
    },
    myDealsAsProcurement: (_: unknown, { status }: { status?: string }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      return ctx.prisma.deal.findMany({
        where: {
          procurementPoint: { ownerId: user.id },
          status: (status as never) ?? undefined,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    dealByQrToken: (_: unknown, { qrToken }: { qrToken: string }, ctx: GraphQLContext) =>
      ctx.prisma.deal.findUnique({ where: { qrToken } }),

    users: (_: unknown, { role }: { role?: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.user.findMany({
        where: { role: (role as never) ?? undefined },
        orderBy: { createdAt: "desc" },
      });
    },
    deals: (
      _: unknown,
      {
        status,
        procurementPointId,
        collectorId,
      }: { status?: string; procurementPointId?: string; collectorId?: string },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.deal.findMany({
        where: {
          status: (status as never) ?? undefined,
          procurementPointId: procurementPointId ?? undefined,
          collectorId: collectorId ?? undefined,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    fireSafetyTests: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.prisma.fireSafetyTest.findMany({ include: { questions: true } }),
    videoContents: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.prisma.videoContent.findMany({ orderBy: { createdAt: "desc" } }),

    suggestAddress: (_: unknown, { query }: { query: string }) => suggestAddress(query),
  },

  Mutation: {
    requestSmsCode: async (
      _: unknown,
      { input }: { input: { phone: string } },
      ctx: GraphQLContext,
    ) => {
      const code = generateSmsCode();
      const expiresAt = new Date(Date.now() + SMS_CODE_TTL_MINUTES * 60_000);
      await ctx.prisma.smsCode.create({ data: { phone: input.phone, code, expiresAt } });
      await sendSmsCode(input.phone, code);
      return true;
    },

    registerCollector: async (
      _: unknown,
      { input }: { input: { phone: string; name: string } },
      ctx: GraphQLContext,
    ) => {
      await ctx.prisma.user.upsert({
        where: { phone: input.phone },
        update: { name: input.name, role: "COLLECTOR" },
        create: { phone: input.phone, name: input.name, role: "COLLECTOR" },
      });
      return true;
    },

    registerProcurement: async (
      _: unknown,
      {
        input,
      }: { input: { phone: string; name: string; orgName: string; inn: string; email: string } },
      ctx: GraphQLContext,
    ) => {
      await ctx.prisma.user.upsert({
        where: { phone: input.phone },
        update: {
          name: input.name,
          orgName: input.orgName,
          inn: input.inn,
          email: input.email,
          role: "PROCUREMENT",
        },
        create: {
          phone: input.phone,
          name: input.name,
          orgName: input.orgName,
          inn: input.inn,
          email: input.email,
          role: "PROCUREMENT",
        },
      });
      return true;
    },

    verifySmsCode: async (
      _: unknown,
      { input }: { input: { phone: string; code: string } },
      ctx: GraphQLContext,
    ) => {
      const record = await ctx.prisma.smsCode.findFirst({
        where: { phone: input.phone, code: input.code, consumed: false },
        orderBy: { createdAt: "desc" },
      });
      if (!record || record.expiresAt < new Date()) {
        throw new Error("Код неверный или истёк");
      }
      await ctx.prisma.smsCode.update({ where: { id: record.id }, data: { consumed: true } });

      const user = await ctx.prisma.user.findUnique({ where: { phone: input.phone } });
      if (!user) {
        throw new Error("Пользователь не найден - сначала завершите регистрацию");
      }

      return { token: signAuthToken(user), user };
    },

    createRawMaterial: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.rawMaterial.create({ data: input as any });
    },
    updateRawMaterial: (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.rawMaterial.update({ where: { id }, data: input as any });
    },
    deleteRawMaterial: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      await ctx.prisma.rawMaterial.delete({ where: { id } });
      return true;
    },

    createRegion: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.region.create({ data: input as any });
    },
    updateRegion: (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.region.update({ where: { id }, data: input as any });
    },
    deleteRegion: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      await ctx.prisma.region.delete({ where: { id } });
      return true;
    },

    createField: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.field.create({ data: input as any });
    },
    updateField: (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.field.update({ where: { id }, data: input as any });
    },
    deleteField: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      await ctx.prisma.field.delete({ where: { id } });
      return true;
    },

    createRoute: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.route.create({ data: input as any });
    },
    updateRoute: (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.route.update({ where: { id }, data: input as any });
    },
    deleteRoute: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      await ctx.prisma.route.delete({ where: { id } });
      return true;
    },

    addStock: (
      _: unknown,
      {
        input,
      }: {
        input: {
          rawMaterialId: string;
          quantityKg: number;
          fieldLatitude?: number;
          fieldLongitude?: number;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const user = requireRole(ctx, "COLLECTOR");
      return ctx.prisma.stock.create({
        data: { ...input, collectorId: user.id } as any,
      });
    },

    createProcurementPoint: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      return ctx.prisma.procurementPoint.create({ data: { ...input, ownerId: user.id } as any });
    },
    updateProcurementPoint: async (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      const user = requireRole(ctx, "PROCUREMENT");
      await assertOwnsProcurementPoint(ctx, id, user.id);
      return ctx.prisma.procurementPoint.update({ where: { id }, data: input as any });
    },
    deleteProcurementPoint: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      await assertOwnsProcurementPoint(ctx, id, user.id);
      await ctx.prisma.procurementPoint.delete({ where: { id } });
      return true;
    },

    createPurchasePlan: async (
      _: unknown,
      { input }: { input: { procurementPointId: string; rawMaterialId: string; volumeKg: number; pricePerKg: number } },
      ctx: GraphQLContext,
    ) => {
      const user = requireRole(ctx, "PROCUREMENT");
      await assertOwnsProcurementPoint(ctx, input.procurementPointId, user.id);
      return ctx.prisma.purchasePlan.create({ data: input as any });
    },
    updatePurchasePlan: async (
      _: unknown,
      { id, input }: { id: string; input: { procurementPointId: string; rawMaterialId: string; volumeKg: number; pricePerKg: number } },
      ctx: GraphQLContext,
    ) => {
      const user = requireRole(ctx, "PROCUREMENT");
      await assertOwnsProcurementPoint(ctx, input.procurementPointId, user.id);
      return ctx.prisma.purchasePlan.update({ where: { id }, data: input as any });
    },
    deletePurchasePlan: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      const plan = await ctx.prisma.purchasePlan.findUniqueOrThrow({ where: { id } });
      await assertOwnsProcurementPoint(ctx, plan.procurementPointId, user.id);
      await ctx.prisma.purchasePlan.delete({ where: { id } });
      return true;
    },

    createDeal: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          procurementPointId: string;
          rawMaterialId: string;
          stockId?: string;
          quantityKg: number;
          pricePerKg: number;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const user = requireRole(ctx, "COLLECTOR");
      return ctx.prisma.deal.create({
        data: {
          ...input,
          collectorId: user.id,
          amount: input.quantityKg * input.pricePerKg,
        },
      });
    },

    acceptDeal: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      await assertOwnsDeal(ctx, id, user.id);
      return ctx.prisma.deal.update({ where: { id }, data: { status: "ACCEPTED" } });
    },
    rejectDeal: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = requireRole(ctx, "PROCUREMENT");
      await assertOwnsDeal(ctx, id, user.id);
      return ctx.prisma.deal.update({ where: { id }, data: { status: "REJECTED" } });
    },
    completeDealByQr: async (
      _: unknown,
      { qrToken }: { qrToken: string },
      ctx: GraphQLContext,
    ) => {
      const user = requireRole(ctx, "PROCUREMENT");
      const deal = await ctx.prisma.deal.findUnique({
        where: { qrToken },
        include: { procurementPoint: true },
      });
      if (!deal || deal.procurementPoint.ownerId !== user.id) {
        throw new AuthError("Сделка не найдена или не принадлежит вашему пункту");
      }
      const payment = await getPaymentProvider().charge(deal.id, deal.amount);
      return ctx.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: "COMPLETED",
          paymentStatus: payment.success ? "STUBBED_PAID" : "NONE",
          completedAt: payment.paidAt,
        },
      });
    },

    createFireSafetyTest: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      const { questions, ...rest } = input as {
        title: string;
        questions: { text: string; options: string[]; correctIndex: number; order?: number }[];
      };
      return ctx.prisma.fireSafetyTest.create({
        data: {
          ...rest,
          questions: {
            create: questions.map((q, i) => ({
              text: q.text,
              options: q.options,
              correctIndex: q.correctIndex,
              order: q.order ?? i,
            })),
          },
        },
        include: { questions: true },
      });
    },
    updateFireSafetyTest: async (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, "ADMIN");
      const { questions, ...rest } = input as {
        title: string;
        questions: { text: string; options: string[]; correctIndex: number; order?: number }[];
      };
      await ctx.prisma.fireSafetyQuestion.deleteMany({ where: { testId: id } });
      return ctx.prisma.fireSafetyTest.update({
        where: { id },
        data: {
          ...rest,
          questions: {
            create: questions.map((q, i) => ({
              text: q.text,
              options: q.options,
              correctIndex: q.correctIndex,
              order: q.order ?? i,
            })),
          },
        },
        include: { questions: true },
      });
    },
    deleteFireSafetyTest: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      await ctx.prisma.fireSafetyTest.delete({ where: { id } });
      return true;
    },

    createVideoContent: (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      return ctx.prisma.videoContent.create({ data: input as any });
    },
    deleteVideoContent: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "ADMIN");
      await ctx.prisma.videoContent.delete({ where: { id } });
      return true;
    },
  },

  RawMaterial: {},

  Field: {
    region: (parent: { regionId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.region.findUnique({ where: { id: parent.regionId } }),
    rawMaterial: (parent: { rawMaterialId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.rawMaterial.findUnique({ where: { id: parent.rawMaterialId } }),
    routes: (parent: { id: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.route.findMany({ where: { fieldId: parent.id } }),
    nearbyProcurementPointsCount: async (
      parent: { regionId: string },
      _: unknown,
      ctx: GraphQLContext,
    ) => ctx.prisma.procurementPoint.count({ where: { regionId: parent.regionId } }),
  },

  Route: {
    field: (parent: { fieldId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.field.findUnique({ where: { id: parent.fieldId } }),
    region: (parent: { regionId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.region.findUnique({ where: { id: parent.regionId } }),
  },

  Stock: {
    collector: (parent: { collectorId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.user.findUnique({ where: { id: parent.collectorId } }),
    rawMaterial: (parent: { rawMaterialId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.rawMaterial.findUnique({ where: { id: parent.rawMaterialId } }),
  },

  ProcurementPoint: {
    owner: (parent: { ownerId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.user.findUnique({ where: { id: parent.ownerId } }),
    region: (parent: { regionId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.region.findUnique({ where: { id: parent.regionId } }),
    purchasePlans: (parent: { id: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.purchasePlan.findMany({ where: { procurementPointId: parent.id } }),
  },

  PurchasePlan: {
    procurementPoint: (parent: { procurementPointId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.procurementPoint.findUnique({ where: { id: parent.procurementPointId } }),
    rawMaterial: (parent: { rawMaterialId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.rawMaterial.findUnique({ where: { id: parent.rawMaterialId } }),
  },

  Deal: {
    collector: (parent: { collectorId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.user.findUnique({ where: { id: parent.collectorId } }),
    procurementPoint: (parent: { procurementPointId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.procurementPoint.findUnique({ where: { id: parent.procurementPointId } }),
    rawMaterial: (parent: { rawMaterialId: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.rawMaterial.findUnique({ where: { id: parent.rawMaterialId } }),
  },
};

async function assertOwnsProcurementPoint(ctx: GraphQLContext, pointId: string, ownerId: string) {
  const point = await ctx.prisma.procurementPoint.findUniqueOrThrow({ where: { id: pointId } });
  if (point.ownerId !== ownerId) throw new AuthError("Пункт приёма вам не принадлежит");
}

async function assertOwnsDeal(ctx: GraphQLContext, dealId: string, ownerId: string) {
  const deal = await ctx.prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { procurementPoint: true },
  });
  if (deal.procurementPoint.ownerId !== ownerId) throw new AuthError("Сделка вам не принадлежит");
}
