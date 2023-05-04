import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';

interface ClassConstructor {
  new (...args: any[]): {};
}

export function Serialize(dto: any) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  logger: Logger;
  constructor(private dto: any) {
    this.logger = new Logger('Geofence Application Logger Initialized');
  }
  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    /**
     *  Run something before a request is handled by the request handler
     */

    /**
     * Run something before the response is sent out
     */
    return handler.handle().pipe(
      map((data: any) => {
        return plainToClass(this.dto, data, {
          excludeExtraneousValues: false,
        });
      })
    );
  }
}
