import { th } from "@/i18n/th";

export type ErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "not_deletable"
  | "unexpected";

export type FieldErrors = Record<string, string[]>;

export interface ActionError {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
}

/** Base class for all expected business errors. */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
}

export class ValidationError extends DomainError {
  readonly code = "validation" as const;
  constructor(
    message: string = th.errors.validation,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = "not_found" as const;
  constructor(what = "resource") {
    super(`${what} not found`);
  }
}

export class ConflictError extends DomainError {
  readonly code = "conflict" as const;
  constructor() {
    super("version conflict");
  }
}

export class ForbiddenError extends DomainError {
  readonly code = "forbidden" as const;
  constructor() {
    super("forbidden");
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = "unauthorized" as const;
  constructor() {
    super("unauthorized");
  }
}

export class NotDeletableError extends DomainError {
  readonly code = "not_deletable" as const;
  constructor() {
    super("built-in topics cannot be deleted");
  }
}

const MESSAGES: Record<ErrorCode, string> = {
  validation: th.errors.validation,
  unauthorized: th.errors.unauthorized,
  forbidden: th.errors.forbidden,
  not_found: th.errors.notFound,
  conflict: th.errors.conflict,
  not_deletable: th.errors.notDeletable,
  unexpected: th.errors.unexpected,
};

export function messageFor(code: ErrorCode): string {
  return MESSAGES[code];
}

/** Convert any thrown value into a safe, user-facing ActionError. */
export function toActionError(err: unknown): ActionError {
  if (err instanceof ValidationError) {
    return { code: err.code, message: err.message, fieldErrors: err.fieldErrors };
  }
  if (err instanceof DomainError) {
    return { code: err.code, message: MESSAGES[err.code] };
  }
  console.error("[unexpected]", err);
  return { code: "unexpected", message: MESSAGES.unexpected };
}
