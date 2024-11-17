import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeviceInfosService } from '../utils/device-infos.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceIdInterceptor implements HttpInterceptor {

  constructor(private deviceInfosService: DeviceInfosService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const clientId = this.deviceInfosService.deviceId;
    const modifiedRequest = request.clone({
      setHeaders: {
        'Device-Id': clientId,
      },
    });
    return next.handle(modifiedRequest);
  }

}
