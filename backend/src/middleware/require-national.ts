import { Request, Response, NextFunction } from "express";
import { isNationalAccessRole } from "../role/roleUtils";

/**
 * Guards global reference-data writes (fotang, institution, dianchuanshi,
 * location) that are managed from the national admin screens only.
 */
export const requireNationalAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !isNationalAccessRole(req.user.role)) {
    res.status(403).json({ message: "Forbidden: hanya admin nasional yang dapat mengubah data induk" });
    return;
  }
  next();
};
