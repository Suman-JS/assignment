import z from "zod";

export const createQuestionSchema = z.object({
  question: z
    .string({
      message: "Question is required",
    })
    .min(1, "Question is required"),
  options: z
    .array(
      z.object({
        text: z
          .string({
            message: "Option text is required",
          })
          .min(1, "Option text is required"),
        isCorrect: z.boolean().optional().default(false),
      })
    )
    .min(2, "At least 2 options are required")
    .max(5, "At most 5 options are allowed"),
  category: z.string().min(1, "Category is required"),
});

export const submitAnswerSchema = z.object({
  question: z.string().min(1, "Question is required"),
  option: z.string().min(1, "Option is required"),
});

export type CreateQuestion = z.infer<typeof createQuestionSchema>;
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;