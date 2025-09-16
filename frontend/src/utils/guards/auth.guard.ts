import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../data-acces/auth/auth.service';
import {inject} from '@angular/core';
import {UserStore} from '../state/user/user.state';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  const router = inject(Router);
  const token = authService.getToken();

    if (token) {
      router.navigate(['/dashboard']);
    } else {
        router.navigate(['/auth']);
    }

  return false;
};
