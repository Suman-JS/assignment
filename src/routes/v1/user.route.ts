import { Router } from "express";

import { UserController } from "@/controllers/user.controller.ts";
import { uploadImage } from "@/middleware/multer";
import { validateRequest } from "@/middleware/validate-request";
import { verifyCookie } from "@/middleware/verify-cookie";
import { UpdateSchema } from "@/validation-schema/auth";

export class UserRoute {
  public router: Router;
  private controller: UserController;

  constructor() {
    this.router = Router();
    this.controller = new UserController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(verifyCookie);
    this.router.get("/", this.controller.get);
    this.router.patch(
      "/",
      uploadImage.single("avatar"),
      validateRequest(UpdateSchema),
      this.controller.update
    );
    this.router.get("/request-otp", this.controller.requestOtp);
  }
}
