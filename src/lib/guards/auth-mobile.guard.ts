import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { environment } from 'src/environments/environment';
import { AuthMobileService } from '../services/auth/auth-mobile.service';
import { UtilsMobileService } from '../services/utils/app-utils.service';

@Injectable({ providedIn: 'root' })
export class AuthMobileGuard {
  constructor(
    private auth: AuthMobileService,
    private router: Router,
    private _utilsMobileService: UtilsMobileService
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this._utilsMobileService.isMobile() && environment.allowUnauthenticatedBrowsing) {
      return true;
    }

    if (next.routeConfig?.path == 'auth') {
      return false;
    } else {
      if (this.auth.isInvalidAccessToken()) {
        console.log(
          'Navegação com access token inválido. Obtendo novo token...'
        );
        await this.auth.getNewAccessToken();
        if (this.auth.isInvalidAccessToken()) {
          this.auth.redirectToLogin();
          return false;
        }
        return true;
      } else if (
        next.data['roles'] &&
        !this.auth.hasAnyPermission(next.data['roles'])
      ) {
        this.router.navigate(['/accessdenied']);
        return false;
      }
    }

    if (!this.auth.isLogged()) {
      this.auth.redirectToLogin();
    }

    return true;
  }
}
