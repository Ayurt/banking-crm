import { Injectable } from '@nestjs/common';

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  timestamp: string;
}

@Injectable()
export class ResponseBuilder {
  success<T>(
    data: T,
    message = 'Request completed successfully',
    meta?: Record<string, unknown>,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  paginated<T>(
    data: T,
    meta: { page: number; limit: number; total: number },
    message = 'Request completed successfully',
  ): ApiSuccessResponse<T> {
    return this.success(data, message, meta);
  }
}
