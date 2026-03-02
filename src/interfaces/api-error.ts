export interface IApiErrorResponse {
  name: string;
  status: number;
  message: string;
  stack: string;
}

export interface IApiErrorMessage {
  error: IApiError;
}

export interface IApiError {
  code: number;
  message: string;
  status: string;
}
