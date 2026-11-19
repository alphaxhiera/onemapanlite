import bcrypt from "bcrypt";
import { Gender, PrismaClient } from "@prisma/client";
import { assertStrongPassword } from "../src/utils/password";

// Allow `npm run admin` to work without a .env file (relative to prisma/schema.prisma).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./onemapan.db";
}

const prisma = new PrismaClient();

const username = (process.env.ADMIN_USERNAME || "admin").trim();
const password = process.env.ADMIN_PASSWORD || "Admin@1234";

const main = async () => {
  assertStrongPassword(password);

  let credential = await prisma.userCredential.findUnique({ where: { username } });

  const hashedPassword = await bcrypt.hash(password, 12);

  if (!credential) {
    credential = await prisma.userCredential.create({
      data: {
        username,
        hashed_password: hashedPassword,
      },
    });
    console.log(`Credential dibuat: ${username}`);
  } else {
    // Always reset the password so the documented default actually works,
    // even if a credential with this username already existed.
    credential = await prisma.userCredential.update({
      where: { user_credential: credential.user_credential },
      data: { hashed_password: hashedPassword },
    });
    console.log(`Password credential '${username}' diperbarui.`);
  }

  let user = await prisma.user.findFirst({
    where: { userCredential: { user_credential: credential.user_credential } },
  });

  if (!user) {
    const fotang = await prisma.fotang.findFirst({ orderBy: { fotang_id: "asc" } });
    if (!fotang) throw new Error("Belum ada data vihara. Jalankan `npm run seed` dulu.");

    const location = await prisma.location.create({
      data: {
        location_name: "Admin",
        localityId: fotang.localityId,
        country_iso: "IDN",
      },
    });

    let qiuDaoId = "ADMIN000001";
    let suffix = 1;
    while (await prisma.qiuDao.findUnique({ where: { qiu_dao_id: qiuDaoId } })) {
      suffix += 1;
      qiuDaoId = `ADMIN${String(suffix).padStart(6, "0")}`;
    }

    await prisma.qiuDao.create({
      data: {
        qiu_dao_id: qiuDaoId,
        qiu_dao_name: "Admin",
        qiu_dao_location: { connect: { fotang_id: fotang.fotang_id } },
        lunar_sui_ci_year: "000",
        lunar_month: "00",
        lunar_day: "00",
        lunar_shi_chen_time: "00",
      },
    });

    const dob = new Date("1990-01-01T00:00:00+07:00");
    user = await prisma.user.create({
      data: {
        user_info_id: qiuDaoId,
        qiudao: { connect: { qiu_dao_id: qiuDaoId } },
        full_name: "Administrator",
        is_qing_kou: false,
        gender: Gender.Male,
        place_of_birth: "-",
        date_of_birth: dob,
        phone_number: "-",
        domicile_location: { connect: { location_id: location.location_id } },
        id_card_location: { connect: { location_id: location.location_id } },
        userCredential: { connect: { user_credential: credential.user_credential } },
      },
    });
    console.log(`User admin dibuat: ${user.user_info_id}`);
  }

  const role = await prisma.role.findFirst({ where: { name: "Super Admin" } });
  if (!role) throw new Error("Role 'Super Admin' tidak ditemukan. Jalankan `npm run seed` dulu.");

  const existingRole = await prisma.userRole.findUnique({
    where: {
      user_id_role_id: { user_id: user.user_info_id, role_id: role.role_id },
    },
  });
  if (!existingRole) {
    await prisma.userRole.create({
      data: { user_id: user.user_info_id, role_id: role.role_id },
    });
    console.log("Role Super Admin ditetapkan.");
  }

  console.log(`\nLogin: ${username} / ${password}`);
};

main()
  .catch((error) => {
    console.error("Gagal membuat admin:", error.message || error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
