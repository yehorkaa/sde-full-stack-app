export interface ApiError {
  statusCode: number;
  message: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
