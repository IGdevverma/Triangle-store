import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {

  const authService = inject(AuthService);

  const router = inject(Router);

  // Login check

  if (!authService.isLoggedIn()) {

    router.navigate(['/login']);

    return false;

  }

  // User data

  const user = authService.getUser();

  // Role check

  if (user?.role === 'admin') {

    return true;

  }

  // Normal user

  router.navigate(['/dashboard']);

  return false;

};