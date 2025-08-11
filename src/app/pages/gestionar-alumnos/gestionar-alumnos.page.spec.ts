import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionarAlumnosPage } from './gestionar-alumnos.page';

describe('GestionarAlumnosPage', () => {
  let component: GestionarAlumnosPage;
  let fixture: ComponentFixture<GestionarAlumnosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionarAlumnosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
