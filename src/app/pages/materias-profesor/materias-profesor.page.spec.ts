import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MateriasProfesorPage } from './materias-profesor.page';

describe('MateriasProfesorPage', () => {
  let component: MateriasProfesorPage;
  let fixture: ComponentFixture<MateriasProfesorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MateriasProfesorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
