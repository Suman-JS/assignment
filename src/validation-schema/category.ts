import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string({
      message: "Name is required",
    })
    .min(1, "Name is required"),
});

export type CreateCategory = z.infer<typeof createCategorySchema>;
