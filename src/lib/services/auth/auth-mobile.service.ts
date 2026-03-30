import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { JwtHelperService } from '@auth0/angular-jwt';

import { environment } from 'src/environments/environment';

import {
  CONFIG_SESSION,
  ConfigSystem,
  LOGIN,
  LOGIN_SESSION,
  PASS,
  PASS_SESSION,
  SESSION,
  newConfigSystem,
} from 'projects/mobile-lib/src/lib/models/config-system.model';
import { CryptoService } from '../../../../../security-lib/src/lib/services/auth/crypto.service';
import { AuthService } from '../../../../../security-lib/src/lib/services/auth/auth.service';
import { AuthenticationResponse } from '../../../../../security-lib/src/lib/models/token.model';
import { ConfigSystemSqliteService } from 'projects/mobile-lib/src/lib/services/config/config-system-sqlite.service';
import { UtilsMobileService } from 'projects/mobile-lib/src/lib/services/utils/app-utils.service';
import { EventBusService } from 'projects/design-lib/src/lib/services/event-bus.service';

@Injectable({
  providedIn: 'root',
})
export class AuthMobileService extends AuthService {

  constructor(
    protected override http: HttpClient,
    protected override jwtHelper: JwtHelperService,
    protected override router: Router,
    protected override cryptoService: CryptoService,
    protected override eventBus: EventBusService,
    protected _utilsMobileService: UtilsMobileService,
    protected _configSystemSqliteService: ConfigSystemSqliteService,
  ) {
    super(http, jwtHelper, router, cryptoService, eventBus);
  }

  protected override async saveLoginData(user: string, password: string){
    if (this._utilsMobileService.isMobile()) {
      LOGIN_SESSION.config = await this.cryptoService.encrypt(user);
      this._configSystemSqliteService
        .createOrUpdateConfig(LOGIN_SESSION)
        .then((x) => console.log('LOGIN ARMAZENADO COM SUCESSO'))
        .catch((x) => console.log('ERRO NO ARMAZENAMENTO DO LOGIN ==> ', x));

      PASS_SESSION.config = await this.cryptoService.encrypt(password);
      this._configSystemSqliteService
        .createOrUpdateConfig(PASS_SESSION)
        .then((x) => console.log('PASS ARMAZENADO COM SUCESSO'))
        .catch((x) => console.log('ERRO NO ARMAZENAMENTO DO PASS ==> ', x));
    }
  }

  protected override async handleAccessRenewalError() {
    if (this._utilsMobileService.isMobile()){
      const login = await this._configSystemSqliteService.findByCode(LOGIN);
      const pass = await this._configSystemSqliteService.findByCode(PASS);
      if (login != null && pass != null) {
        const loginDecript = await this.cryptoService.decrypt(login.config);
        const passDecript = await this.cryptoService.decrypt(pass.config);
        this.login(loginDecript, passDecript, () => {console.log('OK!')});
      }
    } else {
      this.redirectToLogin();
    }
  }

  protected override async executeAfterSaveToken(token: AuthenticationResponse){
    if (this._utilsMobileService.isMobile()) {
      CONFIG_SESSION.config = JSON.stringify(token);
      await this._configSystemSqliteService.createOrUpdateConfig(CONFIG_SESSION);
    }
  }

  public override async carregarToken(tokenGetter: string = null) {
    if (this._utilsMobileService.isConnected()) {
      this._isRefreshingToken.next(true);
      try {
        const token = localStorage.getItem(tokenGetter ?? environment.tokenGetter);
        if (token) {
          const dateExpiresIn = this.jwtHelper.getTokenExpirationDate(token);
          const expiresIn = Math.floor((dateExpiresIn.getTime() - new Date().getTime()) / 1000);
          if (expiresIn > 0) {
            this.createRefreshTokenTimer(expiresIn);
          } else {
            await this.getNewAccessToken();
          }
        }
      } finally {
        this._isRefreshingToken.next(false);
      }
    }
  }

  public async carregarTokenDB() {
    if (this._utilsMobileService.isMobile()) {
      // Se estiverm em mobile deve carregar o token a partir do que estiver no banco de dados.
      const sessionFinded = await this._configSystemSqliteService.findByCode(
        SESSION
      );
      if (sessionFinded != null) {
        CONFIG_SESSION.id = sessionFinded?.id;
        if (sessionFinded.config) {
          CONFIG_SESSION.config = JSON.parse(sessionFinded.config);
          if (CONFIG_SESSION.config != null) {
            //this.payload = this.jwtHelper.decodeToken(CONFIG_SESSION.config['access_token']);
            localStorage.setItem(environment.tokenGetter, CONFIG_SESSION.config['access_token']);
            localStorage.setItem(environment.refreshTokenGetter, CONFIG_SESSION.config['refresh_token']);
            if (this.jwtHelper.isTokenExpired(CONFIG_SESSION.config['refresh_token'])) {
              // REFRESH TOKEN estiver expirado retorna para a tela de login
              this.redirectToLogin();
            } else if (this.jwtHelper.isTokenExpired(CONFIG_SESSION.config['access_token'])) {
              // se o ACCESS TOKEN está expirado tenta obter um novo
              await this.getNewAccessToken();
            } else {
              const dateExpiresIn = this.jwtHelper.getTokenExpirationDate(CONFIG_SESSION.config['access_token']);
              const expiresIn = Math.floor(( dateExpiresIn.getTime()- new Date().getTime()) / 1000);
              this.createRefreshTokenTimer(expiresIn);
            }
          } else {
            console.log('CONFIG -> está nulo: ', CONFIG_SESSION.config)
          }
        } else {
          // se ainda não tem uma configuração realizada mas tem o parametro do
          // sistema de sessão (o usuário instalou o app mas não conectou uma conta ainda)
          // Então informa para o usuário que a sessão está expirada?
        }
      } else {
        // Se não encontrar uma session Então informa para o usuário que a sessão está expirada?
      }
    } else {
      const token = localStorage.getItem(environment.tokenGetter);
      if (token) {
        const dateExpiresIn = this.jwtHelper.getTokenExpirationDate(token);
        const expiresIn = Math.floor(( dateExpiresIn.getTime()- new Date().getTime()) / 1000);
        if (expiresIn > 0) {
          this.createRefreshTokenTimer(expiresIn);
        }
      }
    }
  }
}
