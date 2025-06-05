import { Router } from "express";

import { AuthRoute } from "@/routes/v1/auth.route.ts";
import { CategoryRoute } from "@/routes/v1/category.route.ts";
import { HomeRoute } from "@/routes/v1/home.route.ts";
import { QuestionRoute } from "@/routes/v1/question.route.ts";
import { UserRoute } from "@/routes/v1/user.route.ts";

export class V1APIRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    const homeRouter = new HomeRoute();
    const userRouter = new UserRoute();
    const questionRouter = new QuestionRoute();
    const categoryRouter = new CategoryRoute();
    const authRouter = new AuthRoute();

    this.router.use("/", homeRouter.router);
    this.router.use("/auth", authRouter.router);
    this.router.use("/user", userRouter.router);
    this.router.use("/question", questionRouter.router);
    this.router.use("/category", categoryRouter.router);
  }
}
