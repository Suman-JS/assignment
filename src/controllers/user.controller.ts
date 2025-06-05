import type { NextFunction, Request, Response } from "express";
import { startSession, Types } from "mongoose";

import { generateOTP, sendVerificationCodeViaEmail } from "@/lib/utils";
import { User } from "@/model/user.model";
import type { Update } from "@/validation-schema/auth";

export class UserController {
  public async get(req: Request, res: Response, next: NextFunction) {
    const userId = req.user.userId;

    try {
      const currentUser = await User.findById(userId).select("-otp -__v");

      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: "User not found",
          data: null,
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Successfully fetched user",
        data: currentUser,
      });
    } catch (error) {
      next(error);
    }
  }

  public async requestOtp(req: Request, res: Response, next: NextFunction) {
    const userId = req.user.userId;
    const session = await startSession();
    try {
      const updatedUser = await session.withTransaction(async () => {
        const otp = generateOTP();

        const user = await User.findByIdAndUpdate(
          Types.ObjectId.createFromHexString(userId),
          {
            $set: {
              otp,
            },
          },
          {
            session,
            new: true,
          }
        );
        return user;
      });

      if (!updatedUser) {
        res.status(400).json({
          success: false,
          message: "User not found",
          data: null,
        });
        return;
      }

      await sendVerificationCodeViaEmail({
        email: updatedUser.email,
        otp: updatedUser.otp,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email",
        data: null,
      });
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  }

  public async update(req: Request, res: Response, next: NextFunction) {
    const data = req.body as Update;
    const userId = req.user.userId;
    const image = req.file;
    const session = await startSession();
    try {
      const updatedUser = await session.withTransaction(async () => {
        const user = await User.findByIdAndUpdate(
          Types.ObjectId.createFromHexString(userId),
          {
            $set: {
              ...(image && { imageUrl: image.path }),
              ...(data?.name && { name: data.name }),
              ...(data?.gender && { gender: data.gender }),
            },
          },
          {
            session,
            new: true,
          }
        );
        return user;
      });

      if (!updatedUser) {
        res.status(400).json({
          success: false,
          message: "User not found",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          gender: updatedUser.gender,
          imageUrl: updatedUser.imageUrl,
          isVerified: updatedUser.isVerified,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  }
}
