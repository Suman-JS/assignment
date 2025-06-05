import type { NextFunction, Request, Response } from "express";
import { startSession, Types } from "mongoose";

import { env } from "@/env";
import {
  generateHash,
  generateOTP,
  generateRefreshToken,
  sendVerificationCodeViaEmail,
  verifyHash,
} from "@/lib/utils.ts";
import { User } from "@/model/user.model.ts";
import type { Login, Register, Verify } from "@/validation-schema/auth.ts";

export class AuthController {
  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const data = req.body as Register;
    const session = await startSession();

    try {
      const user = await session.withTransaction(async () => {
        const hashedPassword = await generateHash(data.password);
        const otp = generateOTP();

        const newUser = new User({
          name: data.name,
          email: data.email,
          gender: data.gender,
          otp,
          password: hashedPassword,
        });

        await newUser.save({ session });
        return newUser;
      });

      if (!user) {
        res.status(500).json({
          success: false,
          message: "User could not be created",
        });
        return;
      }

      const refreshToken = generateRefreshToken({
        name: user.name,
        email: user.email,
        id: user._id,
      });

      await sendVerificationCodeViaEmail({
        otp: user.otp,
        email: user.email,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
        },
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: "Email in use",
          data: null,
        });
        return;
      }
      next(error);
    } finally {
      await session.endSession();
    }
  }

  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const data = req.body as Login;

    try {
      const user = await User.findOne({
        email: data.email,
      }).select("+password");

      if (!user) {
        res.status(400).json({
          success: false,
          message: "Invalid credentials",
          data: null,
        });
        return;
      }

      const isValidPassword = await verifyHash({
        password: data.password,
        digest: user.password,
      });

      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: "Invalid credentials",
          data: null,
        });
        return;
      }

      const refreshToken = generateRefreshToken({
        name: user.name,
        email: user.email,
        id: user._id,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Logged in successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const data = req.body as Verify;
    const userId = req.user.userId;
    const session = await startSession();
    try {
      const updatedUser = await session.withTransaction(async () => {
        const user = await User.findOneAndUpdate(
          {
            email: data.email,
            _id: Types.ObjectId.createFromHexString(userId),
            otp: data.otp,
          },
          {
            $set: {
              otp: null,
              isVerified: true,
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
          message: "OTP mismatch, please try again",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Account verified successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.sendStatus(204);
      return;
    } catch (error) {
      next(error);
    }
  }
}
