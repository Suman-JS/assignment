import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import path from "path";

import { ConnectMongoDB } from "@/config/connect-db";
import { env } from "@/env";
import { V1APIRoutes } from "@/routes";

export class App {
  public app: Application;
  private database: ConnectMongoDB;

  constructor() {
    this.app = express();
    this.database = ConnectMongoDB.getInstance();
    this.init();
  }

  private async init() {
    await this.initDatabase();
    this.initMiddlewares();
    this.initRoutes();
    this.initErrorHandling();
  }

  private async initDatabase() {
    try {
      await this.database.connect(env.DATABASE_URL);
    } catch (error) {
      console.error("Failed to connect to database:", error);
    }
  }

  private initMiddlewares() {
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: "*",
      })
    );
    this.app.use(cookieParser());
    this.app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "public", "uploads"))
    );
  }

  private initRoutes() {
    const v1ApiRoutes = new V1APIRoutes();
    this.app.use("/v1/api", v1ApiRoutes.router);
  }

  private initErrorHandling() {
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).json({
          status: false,
          message: "Internal Server Error",
          ...(env.NODE_ENV === "development" && {
            error: err.message,
            stack: err.stack,
          }),
        });
      }
    );

    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });
  }
}
