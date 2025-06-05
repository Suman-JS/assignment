import { env } from "@/env";
import * as argon2 from "argon2";
import { randomInt } from "crypto";
import { parse } from "csv-parse";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import nodemailer from "nodemailer";

interface Option {
  text: string;
  isCorrect?: boolean;
}

interface Question {
  question: string;
  options: Option[];
  category: string;
}

export async function generateHash(password: string) {
  try {
    return argon2.hash(password, {
      secret: Buffer.from(env.PASSWORD_SECRET),
      type: argon2.argon2id,
      parallelism: 4,
      memoryCost: 2 ** 16,
      timeCost: 3,
      hashLength: 50,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function verifyHash({
  password,
  digest,
}: {
  password: string;
  digest: string;
}) {
  try {
    return argon2.verify(digest, password, {
      secret: Buffer.from(env.PASSWORD_SECRET),
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function generateRefreshToken({
  name,
  email,
  id,
}: {
  name: string;
  email: string;
  id: Types.ObjectId;
}) {
  try {
    return jwt.sign(
      {
        userId: id,
        email,
        name,
      },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
  } catch (error) {
    throw error;
  }
}

export function generateOTP() {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += randomInt(0, 10).toString();
  }
  return Number(otp);
}

export function sendVerificationCodeViaEmail({
  email,
  otp,
}: {
  email: string;
  otp: number;
}) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: env.SMTP_EMAIL,
      pass: env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: env.SMTP_EMAIL,
    to: email,
    subject: "Email Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="font-size: 16px; color: #555;">
          Thank you for signing up! Please use the verification code below to verify your email address:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; padding: 15px 30px; border: 2px solid #007bff; border-radius: 8px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #777; text-align: center;">
          This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
        </p>
      </div>
    `,
    text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
  };

  setImmediate(async () => {
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log("Verification email sent successfully:", result.messageId);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }
  });

  return {
    success: true,
    message: "Verification email queued for sending",
  };
}

function safeParseOptions(
  optionsStr: string
): { text: string; isCorrect?: boolean }[] {
  try {
    const cleaned = optionsStr
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse options:", optionsStr);
    return [];
  }
}

export function parseCSVToQuestions(
  filePath: string
): Promise<Question[] | null> {
  return new Promise((resolve, reject) => {
    const questions: Question[] = [];

    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row) => {
        try {
          const parsedOptions = safeParseOptions(row.options);
          questions.push({
            question: row.question,
            options: parsedOptions,
            category: row.category,
          });
        } catch (error) {
          console.error("Failed to parse options:", row.options);
        }
      })
      .on("end", () => {
        fs.unlink(filePath, () => {});
        if (questions.length === 0) {
          resolve(null);
        } else {
          resolve(questions);
        }
      })
      .on("error", reject);
  });
}
