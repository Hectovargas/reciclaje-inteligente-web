import { Params } from 'nestjs-pino';
import { randomUUID } from 'crypto';

export const loggerOptions: Params = {
  pinoHttp: {
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    redact: {
      paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
      censor: '[REDACTED]',
    },
  },
};
