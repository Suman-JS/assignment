import { type Model, model, Schema } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
  }
);

categorySchema.virtual("questionCount", {
  ref: "Question",
  localField: "_id",
  foreignField: "category",
  count: true,
});

export const Category = model(
  "Category",
  categorySchema
) as Model<CategoryDocument>;
