export type AppErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFIGURATION_REQUIRED"
  | "RATE_LIMITED"
  | "PAYMENT_UNVERIFIED"
  | "PROVIDER_FAILURE"
  | "DUPLICATE_REQUEST";

export type AppError = {
  code: AppErrorCode;
  message: string;
  retryable: boolean;
  fieldErrors?: Record<string, string[]>;
};

export function configurationRequired(message: string): AppError {
  return { code: "CONFIGURATION_REQUIRED", message, retryable: false };
}
