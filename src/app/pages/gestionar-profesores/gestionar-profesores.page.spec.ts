import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionarProfesoresPage } from './gestionar-profesores.page';

describe('GestionarProfesoresPage', () => {
  let component: GestionarProfesoresPage;
  let fixture: ComponentFixture<GestionarProfesoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionarProfesoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
