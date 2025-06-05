import { Category } from "@/model/category.model";
import type { CreateCategory } from "@/validation-schema/category";
import type { NextFunction, Request, Response } from "express";
import { startSession } from "mongoose";

export class CategoryController {
  public async create(req: Request, res: Response, next: NextFunction) {
    const data = req.body as CreateCategory;
    const session = await startSession();
    try {
      const newCategory = await session.withTransaction(async () => {
        const [category] = await Category.create(
          [
            {
              name: data.name,
            },
          ],
          {
            session,
          }
        );
        return category;
      });

      if (!newCategory) {
        res.status(500).json({
          status: false,
          message: "Category could not be created",
          data: null,
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Category created successfully",
        data: newCategory,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: "Category already exists",
          data: null,
        });
        return;
      }
      next(error);
    } finally {
      await session.endSession();
    }
  }

  public async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await Category.find({}).sort({ name: 1 });
      res.status(200).json({
        success: true,
        message: "Fetched all categories",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  public async categoryListWithNumberOfQuestions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "category",
            as: "questions",
          },
        },
        {
          $addFields: {
            totalQuestions: {
              $size: "$questions",
            },
          },
        },
        {
          $project: {
            questions: 0,
          },
        },
      ]);

      if (!categories) {
        res.status(404).json({
          success: false,
          message: "No categories found",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Fetched all categories",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAllWithQuestions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "category",
            as: "questions",
            pipeline: [
              {
                $project: {
                  question: 1,
                  "options._id": 1,
                  "options.text": 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
          },
        },
      ]);

      if (!categories) {
        res.status(404).json({
          success: false,
          message: "No categories found",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Fetched all categories",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}
