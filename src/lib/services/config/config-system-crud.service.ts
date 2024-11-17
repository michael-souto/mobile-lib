import { ConfigSystemSqliteService } from './config-system-sqlite.service';
import { Injectable } from '@angular/core';
import { CrudService } from '../design/crud-service.service';
import { UtilsMobileService } from '../utils/app-utils.service';
import { ConfigSystemApiService } from './config-system-api.service';
import { ConfigSystemValidatorService } from './config-system-validator.service';
import { AuthMobileService } from 'projects/security-lib/src/lib/services/auth/auth-mobile.service';
import { ConfigSystem } from '../../models/config-system.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigSystemCrudService extends CrudService<ConfigSystem> {

  constructor(protected override utilsMobileService: UtilsMobileService,
    protected override crudAPIService: ConfigSystemApiService,
    protected override crudSQListeService: ConfigSystemSqliteService,
    protected override validatorModelService: ConfigSystemValidatorService,
    protected override authService: AuthMobileService
    ) {
    super(utilsMobileService, crudAPIService, crudSQListeService, validatorModelService, authService);
  }

  override getNewClass(): ConfigSystem {
    throw new Error('Method not implemented.');
  }

}
