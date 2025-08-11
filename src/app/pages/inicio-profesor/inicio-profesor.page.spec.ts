import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioProfesorPage } from './inicio-profesor.page';

describe('InicioProfesorPage', () => {
  let component: InicioProfesorPage;
  let fixture: ComponentFixture<InicioProfesorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioProfesorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
