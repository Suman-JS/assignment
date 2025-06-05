import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.coerce.number().default(8080),
    DATABASE_URL: z.string().url(),
    REFRESH_TOKEN_SECRET: z.string().min(1),
    PASSWORD_SECRET: z.string().min(1),
    SMTP_EMAIL: z.string().email(),
    SMTP_PASSWORD: z.string().min(1),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === "production" && !input.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: ["DATABASE_URL"],
        message: "Must be set when NODE_ENV is 'production'",
      });
    }
  });

const { data, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const env = data!;

export { env };
