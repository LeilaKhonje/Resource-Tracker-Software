import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const responseDescriptions: Record<number, string> = {
  400: 'The request is invalid or failed validation.',
  401: 'Authentication is missing or invalid.',
  403: 'The authenticated caller does not have permission to perform this operation.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current state of the resource.',
  422: 'The request is syntactically valid but cannot be processed.',
  500: 'An unexpected server error occurred.',
};

/** Adds the standard NestJS error response envelope for the supplied statuses. */
export function ApiStandardErrorResponses(...statuses: number[]) {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: responseDescriptions[status] ?? 'The request failed.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: status },
            message: {
              oneOf: [
                { type: 'string', example: responseDescriptions[status] },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            error: { type: 'string', example: 'Bad Request' },
          },
          required: ['statusCode', 'message'],
        },
      }),
    ),
  );
}
