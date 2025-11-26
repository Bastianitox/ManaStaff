import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearsoliPage } from './crearsoli.page';

describe('CrearsoliPage', () => {
  let component: CrearsoliPage;
  let fixture: ComponentFixture<CrearsoliPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearsoliPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
