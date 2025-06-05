import { Router } from "express";

import { AuthController } from "@/controllers/auth.controller.ts";

import { validateRequest } from "@/middleware/validate-request.ts";

import { verifyCookie } from "@/middleware/verify-cookie";
import {
  loginSchema,
  registerUserSchema,
  verifySchema,
} from "@/validation-schema/auth.ts";

export class AuthRoute {
  public router: Router;
  private controller: AuthController;

  constructor() {
    this.router = Router();
    this.controller = new AuthController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/sign-up",
      validateRequest(registerUserSchema),
      this.controller.register
    );
    this.router.post(
      "/sign-in",
      validateRequest(loginSchema),
      this.controller.login
    );
    this.router.get("/sign-out", this.controller.logout);
    this.router.post(
      "/verify",
      verifyCookie,
      validateRequest(verifySchema),
      this.controller.verifyEmail
    );
  }
}
