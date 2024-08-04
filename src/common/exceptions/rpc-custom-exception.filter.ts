import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcCustomExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    const response = host.switchToHttp().getResponse();

    const rpcError = exception.getError();
    if (
      typeof rpcError === 'object' &&
      'status' in rpcError &&
      'message' in rpcError
    ) {
      const { status, message } = rpcError;
      return response.status(status).json({
        status: isNaN(+status) ? HttpStatus.BAD_REQUEST : +status,
        message,
      });
    }

    const status = HttpStatus.BAD_REQUEST;
    return response.status(status).json({
      status,
      message: rpcError,
    });
  }
}
