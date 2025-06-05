import type { NextFunction, Request, Response } from "express";

export class HomeController {
  public index(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        status: "success",
        message: "Welcome to Home Page",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
