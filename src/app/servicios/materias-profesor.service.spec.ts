import { TestBed } from '@angular/core/testing';

import { MateriasProfesorService } from './materias-profesor.service';

describe('MateriasProfesorService', () => {
  let service: MateriasProfesorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MateriasProfesorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
