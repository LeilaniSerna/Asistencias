import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user?.rol_id === 1) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
