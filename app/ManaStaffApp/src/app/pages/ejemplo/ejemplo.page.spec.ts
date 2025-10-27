import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EjemploPage } from './ejemplo.page';

describe('EjemploPage', () => {
  let component: EjemploPage;
  let fixture: ComponentFixture<EjemploPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EjemploPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
