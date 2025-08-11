import { TestBed } from '@angular/core/testing';

import { GruposProfesorService } from './grupos-profesor.service';

describe('GruposProfesorService', () => {
  let service: GruposProfesorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GruposProfesorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
