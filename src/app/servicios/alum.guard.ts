import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const alumGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user?.rol_id === 4) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
