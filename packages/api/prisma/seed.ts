// ============================================================
// CommutePool — Prisma Seed
// Seeds:
//   1 admin user
//   2 fuel price entries (Hyderabad)
//   5 bike models with real-world mileage
// ============================================================

import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("\ud83c\udf31 Starting CommutePool seed...");

  // ---------------------------------------------------------------------------
  // 1. Admin user
  // ---------------------------------------------------------------------------

  const admin = await prisma.user.upsert({
    where: { phone: "+919999999999" },
    update: {},
    create: {
      phone: "+919999999999",
      name: "CommutePool Admin",
      photo_url: null,
      role: UserRole.BOTH,
      status: UserStatus.ACTIVE,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      cancellation_strikes: 0,
    },
  });

  console.log(`\u2713 Admin user seeded: ${admin.id} (${admin.phone})`);

  // ---------------------------------------------------------------------------
  // 2. Fuel prices — Hyderabad petrol in PAISE (10500 paise = ₹105.00/litre)
  // ---------------------------------------------------------------------------

  const fuelPriceJan = await prisma.adminFuelPrice.upsert({
    where: {
      // upsert by composite: use findFirst logic via create+skip
      // Prisma upsert requires a unique field; use id-based approach below
      id: "00000000-0000-0000-0000-000000000001",
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      city: "Hyderabad",
      price_paise_per_litre: 10500, // ₹105.00/litre
      effective_from: new Date("2025-01-01T00:00:00Z"),
      created_by_id: admin.id,
    },
  });

  const fuelPriceJun = await prisma.adminFuelPrice.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      city: "Hyderabad",
      price_paise_per_litre: 10640, // ₹106.40/litre (June 2025 revision)
      effective_from: new Date("2025-06-01T00:00:00Z"),
      created_by_id: admin.id,
    },
  });

  console.log(
    `\u2713 Fuel prices seeded: ${fuelPriceJan.price_paise_per_litre} paise (Jan), ${fuelPriceJun.price_paise_per_litre} paise (Jun)`
  );

  // ---------------------------------------------------------------------------
  // 3. Bike models with real-world mileage
  // ---------------------------------------------------------------------------

  const bikeModels: Array<{
    id: string;
    bike_model: string;
    real_world_kmpl: number;
  }> = [
    {
      id: "00000000-0000-0000-0000-000000000010",
      bike_model: "Honda Activa 6G",
      real_world_kmpl: 42,
    },
    {
      id: "00000000-0000-0000-0000-000000000011",
      bike_model: "Hero Splendor+",
      real_world_kmpl: 55,
    },
    {
      id: "00000000-0000-0000-0000-000000000012",
      bike_model: "Bajaj Pulsar 150",
      real_world_kmpl: 45,
    },
    {
      id: "00000000-0000-0000-0000-000000000013",
      bike_model: "Royal Enfield Classic 350",
      real_world_kmpl: 32,
    },
    {
      id: "00000000-0000-0000-0000-000000000014",
      bike_model: "TVS Jupiter",
      real_world_kmpl: 44,
    },
  ];

  for (const model of bikeModels) {
    const seeded = await prisma.adminBikeMileage.upsert({
      where: { bike_model: model.bike_model },
      update: { real_world_kmpl: model.real_world_kmpl },
      create: {
        id: model.id,
        bike_model: model.bike_model,
        real_world_kmpl: model.real_world_kmpl,
        created_by_id: admin.id,
      },
    });
    console.log(
      `\u2713 Bike seeded: ${seeded.bike_model} @ ${seeded.real_world_kmpl} kmpl`
    );
  }

  console.log("\n\u2705 CommutePool seed complete.");
}

main()
  .catch((err: unknown) => {
    console.error("\u274c Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
