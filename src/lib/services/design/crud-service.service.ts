import { CrudApiService } from '../../../../../design-lib/src/lib/services/crud-api.service';
import { SAVED_SUCCESSFULLY,DELETED_SUCCESSFULLY, UPDATED_SUCCESSFULLY, UtilsService } from 'projects/design-lib/src/lib/services/utils/utils.service';
import { CrudSqliteService } from './crud-sqlite.service';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidatorModelService } from '../../../../../design-lib/src/lib/services/validator-model.service';
import { HttpErrorResponse } from '@angular/common/http';
import { convertToErrorLog } from '../../../../../design-lib/src/lib/models/error-log-model';
import { UtilsMobileService } from '../utils/app-utils.service';
import { AuthService } from 'projects/security-lib/src/lib/services/auth/auth.service';

export abstract class CrudService<T> {
  constructor(
    protected utilsMobileService: UtilsMobileService,
    protected crudAPIService: CrudApiService<T>,
    protected crudSQListeService: CrudSqliteService<T>,
    protected validatorModelService: ValidatorModelService<T>,
    protected authService: AuthService
  ) {}

  abstract getNewClass(): T;

  async createOrUpdate(entity: T, masterId: string = null, showMessages = true) {
    if (entity['id'] && UtilsService.isValidUUID(entity['id'])) {
      return await this.update(entity, masterId, showMessages);
    } else {
      return await this.create(entity, masterId, showMessages);
    }
  }

  async create(entity: T, masterId: string = null, showMessages = true) {
    const valid = await this.validatorModelService.valid;
    if (valid) {
      if (this.utilsMobileService.isMobile()) {
        await this.crudSQListeService
          .create(entity)
          .catch((error) => {
            this.logAndShowErrorException(error, entity, masterId, 'create');
          });

        if (showMessages) {
          this.utilsMobileService.presentToastTyped((await this.utilsMobileService.getTextTranslated(SAVED_SUCCESSFULLY)) + ' 🗄️', 'success' );
        }

        // Aqui vai entrar na fila um request para a nuvem.
        this.utilsMobileService.asyncFunctionQueueService.enqueueFunction(() => this.requestCreateAPI(entity, masterId, showMessages));
      } else if ((await this.utilsMobileService.isConnected()) && localStorage.getItem(environment.tokenGetter)) {
        await this.requestCreateAPI(entity, masterId);
      }
    } else {
      // TO-DO: REFATURAR CONSIDERANDO A NOVA FORMA DE VALIDAÇÃO
      // let messagesn = '';
      // this.validatorModelService.messages.forEach((m) => {
      //   messagesn += m + '</br>';
      // });
      // this.utilsMobileService.presentToast(messagesn, true);
      return null;
    }
    return entity;
  }

  private async requestCreateAPI(entity: T, masterId: string = null, showMessages = true) {
    const requestAPI$ = this.crudAPIService.create(entity, masterId);
    await lastValueFrom(requestAPI$)
    .then(response => {
      if (!this.utilsMobileService.isMobile()) {
        if (showMessages){
          const message = (this.utilsMobileService.getTextTranslated(SAVED_SUCCESSFULLY)) + ' 🌐';
          this.utilsMobileService.presentToastTyped(message, 'success');
        }
      } else {
        entity['synchronizedAt'] = new Date().toISOString();
        this.crudSQListeService
          .update(entity)
          .catch((error) => {
            this.logAndShowErrorException(error, entity, masterId, 'create');
          });
      }
    })
    .catch((error) => {
      this.logAndShowErrorException(error, entity, masterId, 'create');
    });
  }

  async update(entity: T, masterId: string = null, showMessages = true) {
    let valid = await this.validatorModelService.valid;
    if (valid) {
      if (this.utilsMobileService.isMobile()) {
        let result = await this.crudSQListeService
          .update(entity)
          .catch((error) => {
            this.logAndShowErrorException(error, entity, masterId, 'update');
          });
          if (showMessages) {
            this.utilsMobileService.presentToastTyped((await this.utilsMobileService.getTextTranslated(UPDATED_SUCCESSFULLY)) + ' 🗄️', 'success');
          }
        // Aqui vai entrar na fila um request para a nuvem.
        this.utilsMobileService.asyncFunctionQueueService.enqueueFunction(() => this.requestUpdateAPI(entity, masterId, showMessages));
      } else if ((await this.utilsMobileService.isConnected()) && localStorage.getItem(environment.tokenGetter)) {
        this.requestUpdateAPI(entity, masterId, showMessages);
      }
    } else {
      // TO-DO: REFATURAR CONSIDERANDO A NOVA FORMA DE VALIDAÇÃO
      // let messagesn = '';
      // this.validatorModelService.messages.forEach((m) => {
      //   messagesn += m + '</br>';
      // });
      // this.utilsMobileService.presentToast(messagesn, true);
      return null;
    }
    return entity;
  }

  private async requestUpdateAPI(entity: T, masterId: string = null, showMessages = true) {
    const requestAPI$ = this.crudAPIService.update(entity, masterId);
    await lastValueFrom(requestAPI$)
    .then(async response => {
      if (!this.utilsMobileService.isMobile()) {
        if (showMessages){
          const message = (await this.utilsMobileService.getTextTranslated(UPDATED_SUCCESSFULLY)) + ' 🌐';
          this.utilsMobileService.presentToastTyped(message, 'success');
        }
      } else {
        console.log('ATUALIZANDO DATA DE SINC................')
        entity['synchronizedAt'] = new Date().toISOString();
        this.crudSQListeService
          .update(entity)
          .catch((error) => {
            this.logAndShowErrorException(error, entity, masterId, 'update');
          });
      }
    })
    .catch((error) => {
      this.logAndShowErrorException(error, entity, masterId, 'update');
    });
  }

  protected async beforeDeleteMobile(id?: string, masterId: string = null) {}
  protected async afterDeleteMobile(id?: string, masterId: string = null) {}
  async delete(id?: string, masterId: string = null) {
    const valid = await this.validatorModelService.validForDelete;
    if (valid) {
      if (this.utilsMobileService.isMobile()) {
        await this.beforeDeleteMobile(id, masterId);
        await this.executeDeleteMobile(id, masterId);
        await this.afterDeleteMobile(id, masterId);
        this.utilsMobileService.presentToastTyped((await this.utilsMobileService.getTextTranslated(DELETED_SUCCESSFULLY)) + ' 🗄️', 'success');
      }
      if (await this.canUpdateCloud()) {
        const requestAPI$ = this.crudAPIService.delete(id, masterId);
        await lastValueFrom(requestAPI$).catch((error) => {
          this.logAndShowErrorException(error, null, masterId, 'delete');
        });

        if (!this.utilsMobileService.isMobile()) {
          const message = `${await this.utilsMobileService.getTextTranslated(DELETED_SUCCESSFULLY)} 🌐`;
          this.utilsMobileService.presentToastTyped(message, 'success');
        }
      }
    } else {
      // TO-DO: REFATURAR CONSIDERANDO A NOVA FORMA DE VALIDAÇÃO
      // let messagesn = '';
      // this.validatorModelService.messages.forEach((m) => {
      //   messagesn += m + '</br>';
      // });
      // this.utilsMobileService.presentToast(messagesn, true);
      return false;
    }
    return true;
  }
  protected async executeDeleteMobile(id?: string, masterId: string = null){
    await this.crudSQListeService.delete(id).catch((error) => {
      this.utilsMobileService.presentToastTyped('ERRO!' + error, 'danger');
    });
  }

  async findById(id?: string, masterId: string = null, loadChildrens = false) {
    if (this.utilsMobileService.isMobile()) {
      return this.crudSQListeService.findById(id, loadChildrens);
    } else {
      const requestAPI$ = this.crudAPIService.findById(id, masterId);
      return await lastValueFrom(requestAPI$);
    }
  }

  async findAllPaged(
    filter: any,
    page: number,
    count: number,
    masterId: string = null
  ) {
    if (this.utilsMobileService.isMobile()) {
      return this.crudSQListeService.findAll(filter, page, count);
    } else {
      const requestAPI$ = this.crudAPIService.findAllPaged(
        page,
        count,
        masterId
      );
      return await lastValueFrom(requestAPI$);
    }
  }

  async findAll(filter: any, masterId: string = null) {
    if (this.utilsMobileService.isMobile()) {
      return await this.crudSQListeService.findAll(filter, null, null);
    } else {
      const requestAPI$ = this.crudAPIService.findAll(masterId);
      return await lastValueFrom(requestAPI$);
    }
  }

  findByListId(ids: string[], masterId: string = null) {
    return this.crudAPIService.findByListId(ids, masterId);
  }

  async patch(id?: string, fields?: any, masterId: string = null) {
    let entity = await this.findById(id);
    if (this.utilsMobileService.isMobile()) {
      if (entity != null) {
        let coluns = Object.entries(entity)
          .filter((x) => x[0] != 'id' && !UtilsService.isEmpty(x[1]))
          .forEach((x) => (entity[x[0]] = x[1]));
        let response = await this.crudSQListeService.update(entity);
      }
    }
    if (await this.canUpdateCloud()) {
      const requestAPI$ = this.crudAPIService.patch(id, fields, masterId);
      return await lastValueFrom(requestAPI$);
    }
    return entity;
  }

  private async canUpdateCloud() {
    const connected = await this.utilsMobileService.isConnected();
    return connected && this.authService.isLogged();
  }

  private async logAndShowErrorException(error: HttpErrorResponse, entity: T, masterId: string = null, operation: "create" | "update" | "delete") {
    if (this.utilsMobileService.isMobile()) {
      console.log('INICIANDO TRATAMENTO DE ERRO:', operation, error.status, error.error?.title)
        const errorLog = convertToErrorLog(error);
      if (operation == "update" && error.status == 400 && (error.error?.title == "Resource not found")) {
        await this.requestCreateAPI(entity, masterId);
      } else {
        //await this.utilsMobileService.errorSqliteService.create(errorLog);
        this.utilsMobileService.presentToastTyped(`${error.error?.title} (${error.error?.title})`, 'danger');
      }
    }
  }
}
