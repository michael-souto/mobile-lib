import { Injectable } from '@angular/core';
import { CrudApiService } from 'projects/design-lib/src/lib/services/crud-api.service';
import { ConfigSystem } from '../../models/config-system.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigSystemApiService extends CrudApiService<ConfigSystem> {
  override getAdressAPI(): string {
    return null; //environment.apiURLGateway + '/calendar';
    return 'http://localhost:38000/calendar';
  }
}
