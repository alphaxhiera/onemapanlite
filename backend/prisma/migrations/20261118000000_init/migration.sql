-- CreateTable
CREATE TABLE "User" (
    "user_info_id" TEXT NOT NULL PRIMARY KEY,
    "qiu_dao_id" TEXT NOT NULL,
    "full_name" TEXT COLLATE NOCASE NOT NULL,
    "mandarin_name" TEXT COLLATE NOCASE,
    "is_qing_kou" BOOLEAN NOT NULL,
    "gender" TEXT NOT NULL,
    "blood_type" TEXT,
    "place_of_birth" TEXT NOT NULL,
    "date_of_birth" DATETIME NOT NULL,
    "date_of_death" DATETIME,
    "id_card_number" TEXT,
    "phone_number" TEXT,
    "email" TEXT COLLATE NOCASE,
    "marital_status" TEXT,
    "last_education_level" TEXT,
    "education_major" TEXT,
    "job_name" TEXT,
    "biodata" BLOB,
    "domicile_location_id" INTEGER NOT NULL,
    "id_card_location_id" INTEGER NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "User_qiu_dao_id_fkey" FOREIGN KEY ("qiu_dao_id") REFERENCES "QiuDao" ("qiu_dao_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_domicile_location_id_fkey" FOREIGN KEY ("domicile_location_id") REFERENCES "Location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_id_card_location_id_fkey" FOREIGN KEY ("id_card_location_id") REFERENCES "Location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "role_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT COLLATE NOCASE NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "role_id"),
    CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_info_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role" ("role_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QiuDao" (
    "qiu_dao_id" TEXT NOT NULL PRIMARY KEY,
    "qiu_dao_name" TEXT COLLATE NOCASE,
    "qiu_dao_mandarin_name" TEXT COLLATE NOCASE,
    "qiu_dao_location_id" INTEGER NOT NULL,
    "dian_chuan_shi_id" INTEGER,
    "yin_shi_qd_id" TEXT,
    "yin_shi_qd_name" TEXT,
    "yin_shi_qd_mandarin_name" TEXT,
    "bao_shi_qd_id" TEXT,
    "bao_shi_qd_name" TEXT,
    "bao_shi_qd_mandarin_name" TEXT,
    "lunar_sui_ci_year" TEXT NOT NULL,
    "lunar_month" TEXT NOT NULL,
    "lunar_day" TEXT NOT NULL,
    "lunar_shi_chen_time" TEXT NOT NULL,
    "qiu_dao_card_s3_url" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "QiuDao_qiu_dao_location_id_fkey" FOREIGN KEY ("qiu_dao_location_id") REFERENCES "Fotang" ("fotang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QiuDao_dian_chuan_shi_id_fkey" FOREIGN KEY ("dian_chuan_shi_id") REFERENCES "DianChuanShi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QiuDao_yin_shi_qd_id_fkey" FOREIGN KEY ("yin_shi_qd_id") REFERENCES "QiuDao" ("qiu_dao_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QiuDao_bao_shi_qd_id_fkey" FOREIGN KEY ("bao_shi_qd_id") REFERENCES "QiuDao" ("qiu_dao_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "location_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "location_name" TEXT,
    "location_mandarin_name" TEXT,
    "latitude" INTEGER,
    "longitude" INTEGER,
    "country_iso" TEXT NOT NULL DEFAULT 'IDN',
    "localityId" INTEGER NOT NULL,
    "street" TEXT,
    "postal_code" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "Location_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCredential" (
    "user_credential" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT,
    "username" TEXT COLLATE NOCASE NOT NULL,
    "hashed_password" TEXT,
    "last_logged_in" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "UserCredential_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_info_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fotang" (
    "fotang_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "location_name" TEXT NOT NULL,
    "location_mandarin_name" TEXT,
    "latitude" INTEGER,
    "longitude" INTEGER,
    "area" TEXT NOT NULL,
    "country_iso" TEXT NOT NULL DEFAULT 'IDN',
    "localityId" INTEGER NOT NULL,
    "street" TEXT,
    "postal_code" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "Fotang_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Institution" (
    "institution_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "institution_name" TEXT NOT NULL,
    "institution_leader" TEXT NOT NULL,
    "institution_secretary_general" TEXT
);

-- CreateTable
CREATE TABLE "DianChuanShi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT COLLATE NOCASE,
    "mandarin_name" TEXT COLLATE NOCASE,
    "area" TEXT NOT NULL,
    "is_fuwuyuan" BOOLEAN,
    "ling_ming_time" DATETIME
);

-- CreateTable
CREATE TABLE "SpiritualUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "spiritual_status" TEXT NOT NULL,
    "role_start" DATETIME,
    "role_end" DATETIME,
    "is_fuwuyuan" BOOLEAN,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SpiritualUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("user_info_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Province" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT COLLATE NOCASE NOT NULL
);

-- CreateTable
CREATE TABLE "City" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT COLLATE NOCASE NOT NULL,
    "provinceId" INTEGER NOT NULL,
    CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "District" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT COLLATE NOCASE NOT NULL,
    "cityId" INTEGER NOT NULL,
    CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT COLLATE NOCASE NOT NULL,
    "districtId" INTEGER NOT NULL,
    CONSTRAINT "Locality_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "event_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_mandarin_name" TEXT,
    "is_in_fotang" BOOLEAN NOT NULL DEFAULT true,
    "fotangId" INTEGER,
    "eventLocationId" INTEGER,
    "institutionId" INTEGER,
    "lunar_sui_ci_year" TEXT,
    "lunar_month" TEXT,
    "lunar_day" TEXT,
    "is_recurring" BOOLEAN NOT NULL,
    "description" TEXT,
    "poster_s3_bucket_link" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "Event_fotangId_fkey" FOREIGN KEY ("fotangId") REFERENCES "Fotang" ("fotang_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_eventLocationId_fkey" FOREIGN KEY ("eventLocationId") REFERENCES "EventLocation" ("event_location_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("institution_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventLocation" (
    "event_location_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "location_name" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,
    "street" TEXT,
    "postal_code" TEXT,
    "area" TEXT NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "EventLocation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Occurrence" (
    "occurrence_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_id" INTEGER NOT NULL,
    "greg_occur_date" DATETIME NOT NULL,
    "greg_end_date" DATETIME,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "Occurrence_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_qiu_dao_id_key" ON "User"("qiu_dao_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredential_user_id_key" ON "UserCredential"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredential_username_key" ON "UserCredential"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SpiritualUser_userId_key" ON "SpiritualUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_key" ON "Province"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_provinceId_key" ON "City"("name", "provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_cityId_key" ON "District"("name", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Locality_name_districtId_key" ON "Locality"("name", "districtId");
