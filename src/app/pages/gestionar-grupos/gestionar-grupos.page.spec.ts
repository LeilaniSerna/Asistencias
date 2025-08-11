import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionarGruposPage } from './gestionar-grupos.page';

describe('GestionarGruposPage', () => {
  let component: GestionarGruposPage;
  let fixture: ComponentFixture<GestionarGruposPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionarGruposPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
