import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaProfesorPage } from './lista-profesor.page';

describe('ListaProfesorPage', () => {
  let component: ListaProfesorPage;
  let fixture: ComponentFixture<ListaProfesorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaProfesorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
