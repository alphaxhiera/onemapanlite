import prisma from "../../db";
import { findFotangById } from "../../fotang/fotang.repository";
import {
  createQiuDao,
  findQiuDaoById,
  updateQiuDao,
  removeQiuDao,
  getQiudaosPaginated,
  QiuDaoWithRelations,
} from "./qiudao.repository";
import { Prisma, QiuDao, Korwil } from "@prisma/client";

interface QiudaoInput extends Omit<Prisma.QiuDaoCreateInput, "qiu_dao_card_s3_url" | "qiu_dao_location"> {
  qiu_dao_location_id: number;
  dian_chuan_shi_id?: number;
}

/**
 * Build the next sequential QiuDao id for a vihara. Deriving it from the last
 * existing id (instead of COUNT(*)) keeps ids unique after deletions, which the
 * previous implementation could reuse and collide on the primary key.
 */
export const generateNextQiuDaoId = async (
  fotangId: number,
  area: Korwil
): Promise<string> => {
  const korwilDigit = area.replace("Korwil_", "");
  const viharaIdPadded = fotangId.toString().padStart(4, "0");
  const prefix = `${korwilDigit}${viharaIdPadded}-`;

  const last = await prisma.qiuDao.findFirst({
    where: { qiu_dao_id: { startsWith: prefix } },
    orderBy: { qiu_dao_id: "desc" },
    select: { qiu_dao_id: true },
  });

  let seriIndex = 0;
  let nomor = 0;

  if (last) {
    const match = /^([A-Z])(\d{6})$/.exec(last.qiu_dao_id.slice(prefix.length));
    if (match) {
      seriIndex = match[1].charCodeAt(0) - 65;
      nomor = parseInt(match[2], 10);
    }
  }

  nomor += 1;
  if (nomor > 999999) {
    nomor = 1;
    seriIndex += 1;
  }

  const seriAlpha = String.fromCharCode(65 + seriIndex);
  return `${prefix}${seriAlpha}${nomor.toString().padStart(6, "0")}`;
};

export const registerQiuDao = async (data: QiudaoInput): Promise<QiuDao> => {
  const {
    qiu_dao_name,
    qiu_dao_mandarin_name,
    qiu_dao_location_id,
    lunar_sui_ci_year,
    lunar_month,
    lunar_day,
    lunar_shi_chen_time,
    dian_chuan_shi_id,
    yin_shi_qd_name,
    yin_shi_qd_mandarin_name,
    bao_shi_qd_name,
    bao_shi_qd_mandarin_name,
  } = data;

  if (!qiu_dao_location_id) {
    throw new Error("Lokasi qiudao wajib diisi");
  }

  const validateName = (
    name: string | null | undefined,
    mandarin: string | null | undefined,
    label: string
  ) => {
    if (!name?.trim() && !mandarin?.trim()) {
      throw new Error(`${label} (Indonesia atau Mandarin) wajib diisi.`);
    }
  };

  validateName(qiu_dao_name, qiu_dao_mandarin_name, "Nama QiuDao");
  validateName(yin_shi_qd_name, yin_shi_qd_mandarin_name, "Nama Guru Pengajak");
  validateName(bao_shi_qd_name, bao_shi_qd_mandarin_name, "Nama Guru Penanggung");

  const fotang = await findFotangById(qiu_dao_location_id);
  if (!fotang) throw new Error("Vihara tidak ditemukan");

  const generatedId = await generateNextQiuDaoId(fotang.fotang_id, fotang.area);

  return await createQiuDao({
    qiu_dao_id: generatedId,
    qiu_dao_name,
    qiu_dao_mandarin_name,
    qiu_dao_location: { connect: { fotang_id: qiu_dao_location_id } },
    lunar_sui_ci_year,
    lunar_month,
    lunar_day,
    lunar_shi_chen_time,
    dian_chuan_shi: dian_chuan_shi_id ? { connect: { id: dian_chuan_shi_id } } : undefined,
    yin_shi_qd_name,
    yin_shi_qd_mandarin_name,
    bao_shi_qd_name,
    bao_shi_qd_mandarin_name,
    qiu_dao_card_s3_url: null,
  });
};

interface FetchAllQiudaoOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: string;
  location_name?: string[];
  location_mandarin_name?: string[];
  dian_chuan_shi_name?: string[];
  dian_chuan_shi_mandarin_name?: string[];
  yin_shi_qd_name?: string[];
  yin_shi_qd_mandarin_name?: string[];
  bao_shi_qd_name?: string[];
  bao_shi_qd_mandarin_name?: string[];
  userId?: string;
  userArea?: Korwil;
  fotangId?: number;
}

export const fetchAllQiudao = async ({
  page = 1,
  limit = 10,
  search = "",
  searchField = "qiu_dao_mandarin_name",
  location_name = [],
  location_mandarin_name = [],
  dian_chuan_shi_name = [],
  dian_chuan_shi_mandarin_name = [],
  yin_shi_qd_name = [],
  yin_shi_qd_mandarin_name = [],
  bao_shi_qd_name = [],
  bao_shi_qd_mandarin_name = [],
  userId,
  userArea,
  fotangId,
}: FetchAllQiudaoOptions) => {
  const skip = (page - 1) * limit;

  return await getQiudaosPaginated({
    skip,
    limit,
    search: search ? [search] : [],
    searchField: searchField ? [searchField] : [],
    location_name,
    location_mandarin_name,
    dian_chuan_shi_name,
    dian_chuan_shi_mandarin_name,
    yin_shi_qd_name,
    yin_shi_qd_mandarin_name,
    bao_shi_qd_name,
    bao_shi_qd_mandarin_name,
    userId,
    userArea,
    fotangId,
  });
};

export const getQiuDaoById = async (id: string): Promise<QiuDaoWithRelations | null> => {
  return await findQiuDaoById(id);
};

export type QiuDaoUpdatePayload = {
  qiu_dao_name?: string | null;
  qiu_dao_mandarin_name?: string | null;
  yin_shi_qd_name?: string | null;
  yin_shi_qd_mandarin_name?: string | null;
  bao_shi_qd_name?: string | null;
  bao_shi_qd_mandarin_name?: string | null;
  lunar_sui_ci_year?: string | null;
  lunar_month?: string | null;
  lunar_day?: string | null;
  lunar_shi_chen_time?: string | null;
  qiu_dao_card_s3_url?: string | null;
  dian_chuan_shi_id?: number | null;
  qiu_dao_location_id?: number | null;
};

export const updateQiuDaoById = async (
  id: string,
  updatedData: QiuDaoUpdatePayload
): Promise<QiuDao> => {
  if (!id || typeof id !== "string") {
    throw new Error("ID QiuDao tidak valid");
  }

  // Never pass the request body straight to Prisma: qiu_dao_id must stay
  // immutable and all other columns are whitelisted explicitly.
  const data: Prisma.QiuDaoUpdateInput = {};

  if (updatedData.qiu_dao_name !== undefined) data.qiu_dao_name = updatedData.qiu_dao_name;
  if (updatedData.qiu_dao_mandarin_name !== undefined) data.qiu_dao_mandarin_name = updatedData.qiu_dao_mandarin_name;
  if (updatedData.yin_shi_qd_name !== undefined) data.yin_shi_qd_name = updatedData.yin_shi_qd_name;
  if (updatedData.yin_shi_qd_mandarin_name !== undefined) data.yin_shi_qd_mandarin_name = updatedData.yin_shi_qd_mandarin_name;
  if (updatedData.bao_shi_qd_name !== undefined) data.bao_shi_qd_name = updatedData.bao_shi_qd_name;
  if (updatedData.bao_shi_qd_mandarin_name !== undefined) data.bao_shi_qd_mandarin_name = updatedData.bao_shi_qd_mandarin_name;
  if (updatedData.lunar_sui_ci_year !== undefined && updatedData.lunar_sui_ci_year !== null) data.lunar_sui_ci_year = updatedData.lunar_sui_ci_year;
  if (updatedData.lunar_month !== undefined && updatedData.lunar_month !== null) data.lunar_month = updatedData.lunar_month;
  if (updatedData.lunar_day !== undefined && updatedData.lunar_day !== null) data.lunar_day = updatedData.lunar_day;
  if (updatedData.lunar_shi_chen_time !== undefined && updatedData.lunar_shi_chen_time !== null) data.lunar_shi_chen_time = updatedData.lunar_shi_chen_time;
  if (updatedData.qiu_dao_card_s3_url !== undefined) data.qiu_dao_card_s3_url = updatedData.qiu_dao_card_s3_url;

  if (updatedData.dian_chuan_shi_id !== undefined) {
    data.dian_chuan_shi = updatedData.dian_chuan_shi_id
      ? { connect: { id: updatedData.dian_chuan_shi_id } }
      : { disconnect: true };
  }

  if (updatedData.qiu_dao_location_id !== undefined) {
    if (!updatedData.qiu_dao_location_id) throw new Error("Lokasi qiudao wajib diisi");
    data.qiu_dao_location = { connect: { fotang_id: updatedData.qiu_dao_location_id } };
  }

  return await updateQiuDao(id, data);
};

export const deleteQiuDaoById = async (id: string): Promise<QiuDao> => {
  if (!id || typeof id !== "string") {
    throw new Error("ID tidak valid");
  }
  return await removeQiuDao(id);
};