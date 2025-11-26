import { TestBed } from '@angular/core/testing';

import { SolicitudesApi } from './solicitudes-api';

describe('SolicitudesApi', () => {
  let service: SolicitudesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolicitudesApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
