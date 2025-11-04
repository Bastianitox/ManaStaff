import { TestBed } from '@angular/core/testing';

import { DocumentosApi } from './documentos-api';

describe('DocumentosApi', () => {
  let service: DocumentosApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentosApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
