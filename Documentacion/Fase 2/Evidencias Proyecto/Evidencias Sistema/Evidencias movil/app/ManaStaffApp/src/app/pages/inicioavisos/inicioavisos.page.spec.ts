import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioavisosPage } from './inicioavisos.page';

describe('InicioavisosPage', () => {
  let component: InicioavisosPage;
  let fixture: ComponentFixture<InicioavisosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioavisosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
