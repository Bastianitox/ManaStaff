import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authPrivateGuard } from './auth-private-guard';

describe('authPrivateGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authPrivateGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
