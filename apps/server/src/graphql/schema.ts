export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  enum UserRole {
    COLLECTOR
    PROCUREMENT
    ADMIN
  }

  enum PointType {
    STATIONARY
    MOBILE
  }

  enum DealStatus {
    PENDING
    ACCEPTED
    REJECTED
    COMPLETED
  }

  enum PaymentStatus {
    NONE
    STUBBED_PAID
  }

  type User {
    id: ID!
    phone: String!
    role: UserRole!
    name: String!
    orgName: String
    inn: String
    email: String
    createdAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type AddressSuggestion {
    value: String!
    latitude: Float
    longitude: Float
  }

  type RawMaterial {
    id: ID!
    name: String!
    photoUrl: String
    composition: String
    benefits: String
    seasonStart: String
    seasonEnd: String
    harvestGuide: String
    gostReference: String
  }

  type Region {
    id: ID!
    name: String!
    district: String
  }

  type Field {
    id: ID!
    name: String!
    latitude: Float!
    longitude: Float!
    hasRoute: Boolean!
    region: Region!
    rawMaterial: RawMaterial!
    routes: [Route!]!
    nearbyProcurementPointsCount: Int!
  }

  type Route {
    id: ID!
    name: String!
    field: Field!
    region: Region!
    distanceKm: Float
    durationMin: Int
    trackGeoJson: JSON
    createdAt: DateTime!
  }

  type Stock {
    id: ID!
    collector: User!
    rawMaterial: RawMaterial!
    quantityKg: Float!
    collectedAt: DateTime!
    fieldLatitude: Float
    fieldLongitude: Float
  }

  type ProcurementPoint {
    id: ID!
    owner: User!
    name: String!
    address: String!
    phone: String!
    workingHours: String!
    photoUrl: String
    type: PointType!
    region: Region!
    latitude: Float
    longitude: Float
    purchasePlans: [PurchasePlan!]!
  }

  type PurchasePlan {
    id: ID!
    procurementPoint: ProcurementPoint!
    rawMaterial: RawMaterial!
    volumeKg: Float!
    pricePerKg: Float!
  }

  type Deal {
    id: ID!
    number: Int!
    collector: User!
    procurementPoint: ProcurementPoint!
    rawMaterial: RawMaterial!
    quantityKg: Float!
    pricePerKg: Float!
    amount: Float!
    status: DealStatus!
    paymentStatus: PaymentStatus!
    qrToken: String!
    createdAt: DateTime!
    completedAt: DateTime
  }

  type FireSafetyQuestion {
    id: ID!
    text: String!
    options: JSON!
    correctIndex: Int!
    order: Int!
  }

  type FireSafetyTest {
    id: ID!
    title: String!
    questions: [FireSafetyQuestion!]!
  }

  type VideoContent {
    id: ID!
    title: String!
    url: String!
    description: String
    createdAt: DateTime!
  }

  type ProcurementOffer {
    procurementPoint: ProcurementPoint!
    purchasePlan: PurchasePlan!
    distanceKm: Float
  }

  type Query {
    me: User

    rawMaterials: [RawMaterial!]!
    rawMaterial(id: ID!): RawMaterial

    regions: [Region!]!

    fields(regionId: ID, rawMaterialId: ID): [Field!]!
    field(id: ID!): Field

    routes(regionId: ID): [Route!]!

    myStocks: [Stock!]!

    procurementPoints(regionId: ID): [ProcurementPoint!]!
    procurementPoint(id: ID!): ProcurementPoint
    myProcurementPoints: [ProcurementPoint!]!

    offersForMaterial(rawMaterialId: ID!, regionId: ID, sortBy: String): [ProcurementOffer!]!

    myDealsAsCollector(status: DealStatus): [Deal!]!
    myDealsAsProcurement(status: DealStatus): [Deal!]!
    dealByQrToken(qrToken: String!): Deal

    users(role: UserRole): [User!]!
    deals(status: DealStatus, procurementPointId: ID, collectorId: ID): [Deal!]!

    fireSafetyTests: [FireSafetyTest!]!
    videoContents: [VideoContent!]!

    suggestAddress(query: String!): [AddressSuggestion!]!
  }

  input RegisterCollectorInput {
    phone: String!
    name: String!
  }

  input RegisterProcurementInput {
    phone: String!
    name: String!
    orgName: String!
    inn: String!
    email: String!
  }

  input RequestSmsCodeInput {
    phone: String!
  }

  input VerifySmsCodeInput {
    phone: String!
    code: String!
  }

  input RawMaterialInput {
    name: String!
    photoUrl: String
    composition: String
    benefits: String
    seasonStart: String
    seasonEnd: String
    harvestGuide: String
    gostReference: String
  }

  input RegionInput {
    name: String!
    district: String
  }

  input FieldInput {
    name: String!
    latitude: Float!
    longitude: Float!
    hasRoute: Boolean
    regionId: ID!
    rawMaterialId: ID!
  }

  input RouteInput {
    name: String!
    fieldId: ID!
    regionId: ID!
    distanceKm: Float
    durationMin: Int
    trackGeoJson: JSON
  }

  input StockInput {
    rawMaterialId: ID!
    quantityKg: Float!
    fieldLatitude: Float
    fieldLongitude: Float
  }

  input ProcurementPointInput {
    name: String!
    address: String!
    phone: String!
    workingHours: String!
    photoUrl: String
    type: PointType!
    regionId: ID!
    latitude: Float
    longitude: Float
  }

  input PurchasePlanInput {
    procurementPointId: ID!
    rawMaterialId: ID!
    volumeKg: Float!
    pricePerKg: Float!
  }

  input CreateDealInput {
    procurementPointId: ID!
    rawMaterialId: ID!
    stockId: ID
    quantityKg: Float!
    pricePerKg: Float!
  }

  input FireSafetyQuestionInput {
    text: String!
    options: [String!]!
    correctIndex: Int!
    order: Int
  }

  input FireSafetyTestInput {
    title: String!
    questions: [FireSafetyQuestionInput!]!
  }

  input VideoContentInput {
    title: String!
    url: String!
    description: String
  }

  type Mutation {
    requestSmsCode(input: RequestSmsCodeInput!): Boolean!
    registerCollector(input: RegisterCollectorInput!): Boolean!
    registerProcurement(input: RegisterProcurementInput!): Boolean!
    verifySmsCode(input: VerifySmsCodeInput!): AuthPayload!

    createRawMaterial(input: RawMaterialInput!): RawMaterial!
    updateRawMaterial(id: ID!, input: RawMaterialInput!): RawMaterial!
    deleteRawMaterial(id: ID!): Boolean!

    createRegion(input: RegionInput!): Region!
    updateRegion(id: ID!, input: RegionInput!): Region!
    deleteRegion(id: ID!): Boolean!

    createField(input: FieldInput!): Field!
    updateField(id: ID!, input: FieldInput!): Field!
    deleteField(id: ID!): Boolean!

    createRoute(input: RouteInput!): Route!
    updateRoute(id: ID!, input: RouteInput!): Route!
    deleteRoute(id: ID!): Boolean!

    addStock(input: StockInput!): Stock!

    createProcurementPoint(input: ProcurementPointInput!): ProcurementPoint!
    updateProcurementPoint(id: ID!, input: ProcurementPointInput!): ProcurementPoint!
    deleteProcurementPoint(id: ID!): Boolean!

    createPurchasePlan(input: PurchasePlanInput!): PurchasePlan!
    updatePurchasePlan(id: ID!, input: PurchasePlanInput!): PurchasePlan!
    deletePurchasePlan(id: ID!): Boolean!

    createDeal(input: CreateDealInput!): Deal!
    acceptDeal(id: ID!): Deal!
    rejectDeal(id: ID!): Deal!
    completeDealByQr(qrToken: String!): Deal!

    createFireSafetyTest(input: FireSafetyTestInput!): FireSafetyTest!
    updateFireSafetyTest(id: ID!, input: FireSafetyTestInput!): FireSafetyTest!
    deleteFireSafetyTest(id: ID!): Boolean!

    createVideoContent(input: VideoContentInput!): VideoContent!
    deleteVideoContent(id: ID!): Boolean!
  }
`;
