import type { MyJwtPayload } from "@/middleware/verify-cookie";

declare global {
  namespace Express {
    interface Request {
      user: MyJwtPayload;
    }
  }
}
