import { type Model, model, Schema } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  email: string;
  gender: string;
  isVerified: boolean;
  imageUrl: string;
  otp: number;
  password: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      sparse: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    otp: Number,
    isVerified: { type: Boolean, default: false },
    imageUrl: { type: String },
    password: {
      type: String,
      select: false,
    },
    timezone: { type: String, default: "IST" },
  },
  {
    timestamps: true,
  }
);

export const User = model("User", userSchema) as Model<UserDocument>;
