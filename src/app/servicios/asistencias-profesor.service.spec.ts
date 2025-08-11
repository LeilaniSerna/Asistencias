import { TestBed } from '@angular/core/testing';

import { AsistenciasProfesorService } from './asistencias-profesor.service';

describe('AsistenciasProfesorService', () => {
  let service: AsistenciasProfesorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsistenciasProfesorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
