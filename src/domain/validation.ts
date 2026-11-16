import type { z } from "zod";
import { ValidationError, type FieldErrors } from "@/domain/errors";

/** Parse with a zod schema, converting failures into a ValidationError with field paths. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  throw new ValidationError(undefined, fieldErrors);
}
