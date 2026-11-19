import express, { Request, Response } from "express";
import multer from "multer";
import { importUmatFromExcel, importQiudaoFromExcel } from "./import.service";
import { authenticateJWT } from "../middleware/authentication";
import { authorize } from "../middleware/authorization";
import { env } from "../config/env";
import { assertXlsxBuffer } from "../utils/file-types";
import prisma from "../db";
import { Korwil } from "@prisma/client";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.uploadMaxFileSize * 2, files: 1 },
});

const forbidden = (message: string) => Object.assign(new Error(message), { statusCode: 403 });

// Import runs outside the per-row controller checks, so the caller's scope has
// to be enforced while resolving viharas/qiudaos.
const resolveImportScope = async (req: Request) => {
    const userScope = (req as any).userScope as string | undefined;

    if (userScope === "nasional") return {};

    if (userScope === "wilayah") {
        const area = (req as any).userArea as Korwil | undefined;
        if (!area) throw forbidden("Wilayah pengguna tidak didefinisikan");
        return { allowedArea: area };
    }

    if (userScope === "fotang") {
        const userId = (req as any).user?.user_info_id;
        const user = userId
            ? await prisma.user.findUnique({
                where: { user_info_id: String(userId) },
                select: { qiudao: { select: { qiu_dao_location_id: true } } },
            })
            : null;

        const fotangId = user?.qiudao?.qiu_dao_location_id;
        if (!fotangId) throw forbidden("Admin Vihara tidak terhubung ke vihara manapun");
        return { allowedFotangId: fotangId };
    }

    throw forbidden("Tidak diizinkan mengimpor data");
};

function handleFileMissing(res: Response) {
    return res.status(400).json({ message: "File tidak ditemukan dalam request" });
}

const handleImportError = (res: Response, error: any, fallback: string) => {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
        console.error(fallback, error);
    }
    res.status(statusCode).json({
        message: statusCode >= 500 ? fallback : error.message,
    });
};

router.post(
    "/umat",
    authenticateJWT,
    authorize({ feature: "umat", action: "create" }),
    upload.single("file"),
    (req: Request, res: Response) => {
        void (async () => {
            try {
                if (!req.file) return handleFileMissing(res);

                const scope = await resolveImportScope(req);
                assertXlsxBuffer(req.file.buffer);
                const result = await importUmatFromExcel(req.file.buffer, scope);
                res.status(200).json({ message: "Berhasil mengimpor data", detail: result });
            } catch (err: any) {
                handleImportError(res, err, "Gagal mengimpor data");
            }
        })();
    }
);

router.post(
    "/qiudao",
    authenticateJWT,
    authorize({ feature: "qiudao", action: "create" }),
    upload.single("file"),
    (req: Request, res: Response) => {
        void (async () => {
            try {
                if (!req.file) return handleFileMissing(res);

                const scope = await resolveImportScope(req);
                assertXlsxBuffer(req.file.buffer);
                const result = await importQiudaoFromExcel(req.file.buffer, scope);
                res.status(200).json({ message: "Berhasil mengimpor data Qiudao", detail: result });
            } catch (err: any) {
                handleImportError(res, err, "Gagal mengimpor data Qiudao");
            }
        })();
    }
);

export default router;
