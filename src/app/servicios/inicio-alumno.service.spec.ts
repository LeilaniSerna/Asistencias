import { TestBed } from '@angular/core/testing';

import { InicioAlumnoService } from './inicio-alumno.service';

describe('InicioAlumnoService', () => {
  let service: InicioAlumnoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InicioAlumnoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
