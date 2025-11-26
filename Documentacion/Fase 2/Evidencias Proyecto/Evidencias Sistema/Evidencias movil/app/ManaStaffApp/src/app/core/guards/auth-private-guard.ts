import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth-service';

export const authPrivateGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getIsAuthenticated().pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/']);
        return false;
      } else {
        return true;
      }
    })
  );
};