import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialAsistenciasPage } from './historial-asistencias.page';

describe('HistorialAsistenciasPage', () => {
  let component: HistorialAsistenciasPage;
  let fixture: ComponentFixture<HistorialAsistenciasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialAsistenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
