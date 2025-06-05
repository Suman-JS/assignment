import {type ZodSchema} from "zod";
import type {NextFunction, Request, Response} from "express";

export const validateRequest = <T extends ZodSchema<any>>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errorMessages = Object.entries(result.error.format())
                .filter(([key]) => key !== "_errors")
                .map(([key, value]) => ({
                    field: key,
                    message: (value as any)._errors?.[0] || "Invalid value",
                }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errorMessages,
            });
            return;
        }
        req.body = result.data;
        next();
    };
};
