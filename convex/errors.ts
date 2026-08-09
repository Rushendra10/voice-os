import { ConvexError } from "convex/values";
import type { ErrorCode } from "../packages/contracts/src/index";
import { DomainError } from "./model";

export type RunnerErrorData = {
  code: ErrorCode;
  message: string;
  retryable: boolean;
};

export function runnerError(code: ErrorCode, message: string, retryable = false): ConvexError<RunnerErrorData> {
  return new ConvexError({ code, message, retryable });
}

export function rethrowDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw runnerError(error.code, error.message, error.retryable);
  }
  throw error;
}
