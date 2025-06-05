import { parseCSVToQuestions } from "@/lib/utils";
import { Category } from "@/model/category.model";
import { Question, type Option } from "@/model/question.model";
import { UserSubmission } from "@/model/user-submission.model";
import type {
  CreateQuestion,
  SubmitAnswer,
} from "@/validation-schema/question";
import type { NextFunction, Request, Response } from "express";
import { startSession, Types } from "mongoose";

export interface UserSubmissionData {
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  selectedOptionId: Types.ObjectId;
  selectedOptionText: string;
  isCorrect: boolean;
  submittedAt: Date;
  submittedAtUserTimezone: string;
  userTimezone: string;
}

export interface QuestionSearchResult {
  _id: Types.ObjectId;
  question: string;
  options: Option[];
  category: Types.ObjectId;
  score?: number;
  distance?: number;
  totalSubmissions: number;
  correctSubmissions: number;
  incorrectSubmissions: number;
  submissionsData: UserSubmissionData[];
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionController {
  public async create(req: Request, res: Response, next: NextFunction) {
    const data = req.body as CreateQuestion;
    const session = await startSession();
    try {
      const category = await Category.findById(data.category);

      if (!category) {
        res.status(400).json({
          success: false,
          message: "Category does not exist",
          data: null,
        });
        return;
      }

      const newQuestion = await session.withTransaction(async () => {
        const [question] = await Question.create(
          [
            {
              question: data.question,
              options: data.options,
              category: data.category,
            },
          ],
          {
            session,
          }
        );
        return question;
      });

      if (!newQuestion) {
        res.status(500).json({
          success: false,
          message: "Question could not be created",
          data: null,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: newQuestion,
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

  public async getAllByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { categoryId } = req.params;

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;

    const sortOrder: "asc" | "desc" =
      req.query.sortOrder === "asc" || req.query.sortOrder === "desc"
        ? req.query.sortOrder
        : "asc";

    const skip = page ? (page - 1) * limit : 0;
    try {
      const category = await Category.findById(categoryId);

      if (!category) {
        res.status(400).json({
          success: false,
          message: "Category does not exist",
          data: null,
        });
        return;
      }

      const [result] = await Question.aggregate([
        {
          $match: {
            category: Types.ObjectId.createFromHexString(categoryId),
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $project: {
            _id: 1,
            question: 1,
            categoryName: "$categoryInfo.name",
            options: {
              $map: {
                input: "$options",
                as: "option",
                in: {
                  _id: "$$option._id",
                  text: "$$option.text",
                },
              },
            },
          },
        },
        {
          $sort: {
            question: sortOrder === "asc" ? 1 : -1,
          },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const questions = result.data;
      const totalCount = result.totalCount[0]?.count || 0;

      const totalPages = Math.ceil(totalCount / limit);
      const pagination = {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      res.status(200).json({
        success: true,
        message: "Fetched all questions",
        data: {
          questions,
          pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async submitAnswer(req: Request, res: Response, next: NextFunction) {
    const data = req.body as SubmitAnswer;
    const userId = req.user.userId;
    const session = await startSession();

    if (!Types.ObjectId.isValid(data.question)) {
      res.status(400).json({
        success: false,
        message: "Invalid question id",
        data: null,
      });
      return;
    }

    if (!Types.ObjectId.isValid(data.option)) {
      res.status(400).json({
        success: false,
        message: "Invalid option id",
        data: null,
      });
      return;
    }

    try {
      const [question] = await Question.aggregate([
        // ? This query just checks if the option is correct or not
        //     {
        //       $match: {
        //         _id: Types.ObjectId.createFromHexString(data.question),
        //       },
        //     },
        //     {
        //       $unwind: "$options",
        //     },
        //     {
        //       $match: {
        //         "options._id": Types.ObjectId.createFromHexString(data.option),
        //       },
        //     },
        //     {
        //       $project: {
        //         _id: 1,
        //         question: 1,
        //         optionId: "$options._id",
        //         option: "$options.text",
        //         isCorrect: "$options.isCorrect",
        //       },
        //     },

        {
          $match: {
            _id: Types.ObjectId.createFromHexString(data.question),
          },
        },
        {
          $project: {
            question: 1,
            selectedOption: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$options",
                    cond: {
                      $eq: [
                        "$$this._id",
                        Types.ObjectId.createFromHexString(data.option),
                      ],
                    },
                  },
                },
                0,
              ],
            },
            correctAnswers: {
              $filter: {
                input: "$options",
                cond: { $eq: ["$$this.isCorrect", true] },
              },
            },
          },
        },
        {
          $project: {
            question: 1,
            selectedOption: {
              _id: "$selectedOption._id",
              text: "$selectedOption.text",
              isCorrect: "$selectedOption.isCorrect",
            },
            correctAnswers: {
              $map: {
                input: "$correctAnswers",
                as: "correct",
                in: {
                  _id: "$$correct._id",
                  text: "$$correct.text",
                },
              },
            },
            isSelectedCorrect: "$selectedOption.isCorrect",
          },
        },
      ]);

      if (!question) {
        res.status(400).json({
          success: false,
          message: "Question does not exist",
          data: null,
        });
        return;
      }

      await session.withTransaction(async () => {
        await UserSubmission.findOneAndUpdate(
          {
            user: Types.ObjectId.createFromHexString(userId),
            question: Types.ObjectId.createFromHexString(data.question),
          },
          {
            $set: {
              user: Types.ObjectId.createFromHexString(userId),
              question: Types.ObjectId.createFromHexString(data.question),
              selectedOption: Types.ObjectId.createFromHexString(data.option),
              isCorrect: question.isSelectedCorrect,
              submittedAt: new Date(),
            },
          },
          {
            upsert: true,
            session,
            new: true,
            runValidators: true,
          }
        );
      });

      if (!question.isSelectedCorrect) {
        res.status(200).json({
          success: true,
          message: "Wrong answer",
          data: question,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Correct answer",
        data: question,
      });
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  }

  public async bulkCreateQuestions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const file = req.file;
    const session = await startSession();
    if (!file) {
      res.status(400).json({
        status: false,
        message: "File is required",
        data: null,
      });
      return;
    }
    try {
      const questions = await parseCSVToQuestions(file.path);

      if (!questions) {
        res.status(400).json({
          status: false,
          message: "Failed to parse CSV",
          data: null,
        });
        return;
      }

      const newQuestions = await session.withTransaction(async () => {
        const insertedData = await Question.create(questions, {
          session,
          ordered: true,
        });
        return insertedData;
      });

      if (!newQuestions.length) {
        res.status(400).json({
          status: false,
          message: "Failed to create questions",
          data: null,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Bulk questions created successfully",
        data: newQuestions,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: `Question: '${error.keyValue.question}' already exists`,
          data: null,
        });
        return;
      }
      next(error);
    } finally {
      await session.endSession();
    }
  }

  public async search(req: Request, res: Response, next: NextFunction) {
    const {
      q: query,
      page,
      limit,
    } = req.query as { q: string; page: string; limit: string };

    if (!query) {
      res.status(400).json({
        success: false,
        message: "Search query 'q' is required",
        data: null,
      });
      return;
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    try {
      const escapedTerm = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const aggregationResult = await Question.aggregate([
        {
          $match: {
            question: {
              $regex: escapedTerm,
              $options: "i",
            },
          },
        },
        {
          $lookup: {
            from: "usersubmissions",
            localField: "_id",
            foreignField: "question",
            as: "submissions",
            pipeline: [
              { $sort: { submittedAt: -1 } },
              {
                $lookup: {
                  from: "users",
                  localField: "user",
                  foreignField: "_id",
                  as: "user",
                  pipeline: [{ $project: { name: 1, email: 1 } }],
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            ],
          },
        },
        {
          $addFields: {
            totalSubmissions: { $size: "$submissions" },
            correctSubmissions: {
              $size: {
                $filter: {
                  input: "$submissions",
                  cond: { $eq: ["$$this.isCorrect", true] },
                },
              },
            },
            incorrectSubmissions: {
              $size: {
                $filter: {
                  input: "$submissions",
                  cond: { $eq: ["$$this.isCorrect", false] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            submissionsData: {
              $map: {
                input: "$submissions",
                as: "sub",
                in: {
                  userId: "$$sub.user._id",
                  userName: "$$sub.user.name",
                  userEmail: "$$sub.user.email",
                  selectedOptionId: "$$sub.selectedOption",
                  selectedOptionText: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$options",
                              cond: {
                                $eq: ["$$this._id", "$$sub.selectedOption"],
                              },
                            },
                          },
                          in: "$$this.text",
                        },
                      },
                      0,
                    ],
                  },
                  isCorrect: "$$sub.isCorrect",
                  submittedAt: "$$sub.submittedAt",
                  submittedAtUserTimezone: {
                    $dateToString: {
                      date: "$sub.submittedAt",
                      timezone: { $ifNull: ["$sub.userTimezone", "UTC"] },
                      format: "%Y-%m-%d %H:%M:%S",
                    },
                  },
                  userTimezone: { $ifNull: ["$sub.userTimezone", "UTC"] },
                },
              },
            },
          },
        },
        { $project: { submissions: 0 } },
        {
          $facet: {
            paginatedResults: [{ $skip: skip }, { $limit: limitNumber }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      if (!aggregationResult[0]) {
        res.status(404).json({
          success: false,
          message: "No results found",
          data: null,
        });
        return;
      }

      const results = aggregationResult[0].paginatedResults;

      const totalResults =
        aggregationResult[0].totalCount.length > 0
          ? aggregationResult[0].totalCount[0].count
          : 0;

      const totalPages = Math.ceil(totalResults / limitNumber);

      const pagination = {
        totalCount: totalResults,
        currentPage: pageNumber,
        totalPages,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      };

      res.status(200).json({
        success: true,
        message: "Search results fetched successfully",
        data: {
          results,
          pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
