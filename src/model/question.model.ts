import { type Model, model, Schema, Types } from "mongoose";

export interface Option {
  _id?: Types.ObjectId;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDocument extends Document {
  question: string;
  options: Option[];
  category: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<Option>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false, select: false },
  },
  { _id: true }
);

const questionSchema = new Schema<QuestionDocument>(
  {
    question: { type: String, required: true, unique: true, trim: true },
    options: { type: [optionSchema], required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index(
  {
    question: "text",
    "options.text": "text",
  },
  {
    weights: {
      question: 10,
      "options.text": 5,
    },
    name: "question_text_index",
  }
);

export const Question = model(
  "Question",
  questionSchema
) as Model<QuestionDocument>;
