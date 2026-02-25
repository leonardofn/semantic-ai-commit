export interface ApiErrorResponse {
  name: string;
  status: number;
  message: string;
  stack: string;
}

export interface ApiErrorMessage {
  error: ApiError;
}

export interface ApiError {
  code: number;
  message: string;
  status: string;
}
