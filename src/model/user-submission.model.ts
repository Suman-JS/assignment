import { Model, model, Schema, Types } from "mongoose";

export interface UserSubmissionDocument extends Document {
  user: Types.ObjectId;
  question: Types.ObjectId;
  selectedOption: Types.ObjectId;
  isCorrect: boolean;
  submittedAt: Date;
  userTimezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSubmissionSchema = new Schema<UserSubmissionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOption: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    userTimezone: {
      type: String,
      required: true,
      default: "IST",
    },
  },
  {
    timestamps: true,
  }
);

userSubmissionSchema.index({ user: 1, question: 1 });
userSubmissionSchema.index({ question: 1 });
userSubmissionSchema.index({ submittedAt: 1 });
userSubmissionSchema.index({ user: 1, submittedAt: -1 });

export const UserSubmission = model(
  "UserSubmission",
  userSubmissionSchema
) as Model<UserSubmissionDocument>;
