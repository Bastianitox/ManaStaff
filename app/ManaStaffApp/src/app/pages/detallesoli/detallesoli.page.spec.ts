import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallesoliPage } from './detallesoli.page';

describe('DetallesoliPage', () => {
  let component: DetallesoliPage;
  let fixture: ComponentFixture<DetallesoliPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetallesoliPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
