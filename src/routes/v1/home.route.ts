import { Router } from "express";

import { HomeController } from "@/controllers/home.controller";

export class HomeRoute {
  public router: Router;
  private controller: HomeController;

  constructor() {
    this.router = Router();
    this.controller = new HomeController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/", this.controller.index);
  }
}
