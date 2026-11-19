import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { Korwil, Prisma, PrismaClient } from "@prisma/client";

// Default local SQLite path so `npm run seed` works without a .env file.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./onemapan.db";
}

const prisma = new PrismaClient();

type Row = Record<string, string>;

const rows = (file: string, delimiter: string): Row[] =>
  parse(fs.readFileSync(path.join(__dirname, "../data", file), "utf8"), {
    columns: true,
    delimiter,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  }) as Row[];

const num = (value?: string): number | null =>
  value && value.trim() !== "" ? parseInt(value, 10) : null;

const text = (value?: string): string | null =>
  value && value.trim() !== "" ? value.trim() : null;

// The source CSVs contain duplicate rows; keep the first occurrence of each
// unique key so the inserts do not violate @@unique constraints.
const dedupe = <T>(items: T[], key: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const insertAll = async (table: string, data: any[], label: string) => {
  for (let i = 0; i < data.length; i += 1000) {
    await (prisma as any)[table].createMany({ data: data.slice(i, i + 1000) });
  }
  console.log(`${label}: ${data.length} rows`);
};

const seedReferenceData = async () => {
  if ((await prisma.province.count()) > 0) {
    console.log("Reference data already present, skipping.");
    return;
  }

  await insertAll(
    "province",
    dedupe(rows("provinces.csv", ";").map((r) => ({ id: num(r.id)!, name: r.name.trim() })), (r) => String(r.id)),
    "Provinces"
  );
  await insertAll(
    "city",
    dedupe(rows("cities.csv", ";").map((r) => ({ id: num(r.id)!, name: r.name.trim(), provinceId: num(r.provinceId)! })), (r) => `${r.name}|${r.provinceId}`),
    "Cities"
  );
  await insertAll(
    "district",
    dedupe(rows("districts.csv", ";").map((r) => ({ id: num(r.id)!, name: r.name.trim(), cityId: num(r.cityId)! })), (r) => `${r.name}|${r.cityId}`),
    "Districts"
  );
  await insertAll(
    "locality",
    dedupe(rows("localities.csv", ";").map((r) => ({ id: num(r.id)!, name: r.name.trim(), districtId: num(r.districtId)! })), (r) => `${r.name}|${r.districtId}`),
    "Localities"
  );

  // Only import viharas whose locality was present in the CSV set.
  const validLocalityIds = new Set(
    (await prisma.locality.findMany({ select: { id: true } })).map((l) => l.id)
  );
  const fotangs = dedupe(rows("fotang.csv", ","), (r) => r.fotang_id)
    .filter((r) => validLocalityIds.has(num(r.localityId)!))
    .map((r) => ({
      fotang_id: num(r.fotang_id)!,
      location_name: r.location_name.trim(),
      location_mandarin_name: text(r.location_mandarin_name),
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      area: r.area.trim() as Korwil,
      country_iso: text(r.country_iso) || "IDN",
      localityId: num(r.localityId)!,
      street: text(r.street),
      postal_code: text(r.postal_code),
    }));
  await insertAll("fotang", fotangs, "Fotang");

  await insertAll(
    "dianChuanShi",
    dedupe(rows("dian_chuan_shi.csv", ","), (r) => r.id).map((r) => ({
      id: num(r.id)!,
      name: text(r.name),
      mandarin_name: text(r.mandarin_name),
      area: r.area.trim() as Korwil,
      is_fuwuyuan: String(r.is_fuwuyuan).trim().toUpperCase() === "TRUE",
    })),
    "DianChuanShi"
  );
};

const national = {
  umat: { create: true, read: true, update: true, delete: true, scope: "nasional" },
  qiudao: { create: true, read: true, update: true, delete: true, scope: "nasional" },
  dashboard: { read_national: true, scope: "nasional" },
  kegiatan: { create: true, read: true, update: true, delete: true, scope: "nasional" },
  account: { create_role: true, edit_role: true, delete_role: true, scope: "nasional" },
};

const roles: { name: string; permissions: Record<string, unknown> }[] = [
  { name: "Super Admin", permissions: national },
  { name: "Ketua Lembaga", permissions: national },
  { name: "Sekjen Lembaga", permissions: national },
  {
    name: "Admin",
    permissions: {
      umat: { create: true, read: true, update: true, delete: true, scope: "wilayah" },
      qiudao: { create: true, read: true, update: true, delete: true, scope: "wilayah" },
      dashboard: { read_area: true, scope: "wilayah" },
      kegiatan: { create: true, read: true, update: true, delete: true, scope: "wilayah" },
    },
  },
  {
    name: "Admin Vihara",
    permissions: {
      umat: { create: true, read: true, update: true, delete: true, scope: "fotang" },
      qiudao: { read: true, update: true, scope: "fotang" },
      dashboard: { read_area: true, scope: "fotang" },
      kegiatan: { create: true, read: true, update: true, delete: true, scope: "fotang" },
    },
  },
  {
    name: "User",
    permissions: {
      umat: { read: true, scope: "self" },
      qiudao: { read: true, scope: "self" },
      kegiatan: { read: true, scope: "self" },
    },
  },
];

const seedRoles = async () => {
  for (const role of roles) {
    const existing = await prisma.role.findFirst({ where: { name: role.name } });
    if (existing) continue;
    await prisma.role.create({
      data: {
        name: role.name,
        description: `Default role: ${role.name}`,
        permissions: role.permissions as Prisma.InputJsonValue,
      },
    });
    console.log(`Role: ${role.name}`);
  }
};

(async () => {
  try {
    await seedReferenceData();
    await seedRoles();
    console.log("Seed selesai.");
  } catch (error) {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
