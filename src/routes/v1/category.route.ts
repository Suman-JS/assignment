import { CategoryController } from "@/controllers/category.controller.ts";
import { validateRequest } from "@/middleware/validate-request";
import { verifyCookie } from "@/middleware/verify-cookie";
import { createCategorySchema } from "@/validation-schema/category";
import { Router } from "express";

export class CategoryRoute {
  public router: Router;
  private controller: CategoryController;

  constructor() {
    this.router = Router();
    this.controller = new CategoryController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(verifyCookie);
    this.router.post(
      "/",
      validateRequest(createCategorySchema),
      this.controller.create
    );
    this.router.get("/", this.controller.getAll);
    this.router.get("/all", this.controller.getAllWithQuestions);
    this.router.get("/list", this.controller.categoryListWithNumberOfQuestions);
  }
}
