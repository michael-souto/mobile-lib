import { Injectable } from '@angular/core';
import { ValidatorModelService } from 'projects/design-lib/src/lib/services/validator-model.service';
import { ConfigSystem } from 'src/app/models/config-system.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigSystemValidatorService extends ValidatorModelService<ConfigSystem> {
  protected override validate(entity: ConfigSystem) {
    return true;
  }
}
