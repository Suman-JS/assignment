import { env } from "@/env";
import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface MyJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export function verifyCookie(req: Request, res: Response, next: NextFunction) {
  const token =
    req.cookies.refreshToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
      data: null,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as MyJwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Invalid or expired token",
      data: null,
    });
  }
}
