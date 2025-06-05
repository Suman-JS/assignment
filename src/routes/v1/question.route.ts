import { Router } from "express";

import { QuestionController } from "@/controllers/question.controller.ts";
import { uploadDocument } from "@/middleware/multer";
import { validateRequest } from "@/middleware/validate-request";
import { verifyCookie } from "@/middleware/verify-cookie";
import {
  createQuestionSchema,
  submitAnswerSchema,
} from "@/validation-schema/question";

export class QuestionRoute {
  public router: Router;
  private controller: QuestionController;

  constructor() {
    this.router = Router();
    this.controller = new QuestionController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(verifyCookie);
    this.router.post(
      "/",
      validateRequest(createQuestionSchema),
      this.controller.create
    );

    this.router.post(
      "/bulk-create",
      uploadDocument.single("questions"),
      this.controller.bulkCreateQuestions
    );
    this.router.post(
      "/answer",
      validateRequest(submitAnswerSchema),
      this.controller.submitAnswer
    );
    this.router.get("/search", this.controller.search);
    this.router.get("/:categoryId", this.controller.getAllByCategory);
  }
}
