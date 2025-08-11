import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionarMateriasPage } from './gestionar-materias.page';

describe('GestionarMateriasPage', () => {
  let component: GestionarMateriasPage;
  let fixture: ComponentFixture<GestionarMateriasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionarMateriasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
