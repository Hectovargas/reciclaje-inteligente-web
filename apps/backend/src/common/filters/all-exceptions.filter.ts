import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      message = typeof response === 'string' ? response : (response as any).message || exception.message;
      code = 'HTTP_EXCEPTION';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = `Unique constraint failed on the fields: ${(exception.meta?.target as string[])?.join(', ')}`;
          code = 'PRISMA_UNIQUE_CONSTRAINT';
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Record to update not found.';
          code = 'PRISMA_NOT_FOUND';
          break;
        default:
          httpStatus = HttpStatus.BAD_REQUEST;
          message = `Database error: ${exception.message}`;
          code = `PRISMA_ERROR_${exception.code}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`Exception: ${message}`, exception instanceof Error ? exception.stack : '');

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
      code,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
