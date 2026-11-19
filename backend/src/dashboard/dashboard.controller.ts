import { Router, Request, Response } from "express";
import { getDashboardStats } from "./dashboard.service";
import { authenticateJWT } from "../middleware/authentication";

const router = Router();

router.get(
    "/stats",
    authenticateJWT,
    async (req: Request, res: Response) => {
        try {
        const token = (req as any).user;
        const stats = await getDashboardStats({
            scope: token?.scope,
            area: token?.area,
            fotangId: token?.fotang_id,
            userId: token?.user_info_id ? String(token.user_info_id) : undefined,
        });
        res.json(stats);
        } catch (error: any) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Gagal mengambil data dashboard" });
        }
    }
);

export default router;