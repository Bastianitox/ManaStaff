import { TestBed } from '@angular/core/testing';

import { AnunciosApi } from './anuncios-api';

describe('AnunciosApi', () => {
  let service: AnunciosApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnunciosApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
