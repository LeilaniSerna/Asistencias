import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CapturaCalificacionesPage } from './captura-calificaciones.page';

describe('CapturaCalificacionesPage', () => {
  let component: CapturaCalificacionesPage;
  let fixture: ComponentFixture<CapturaCalificacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CapturaCalificacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
