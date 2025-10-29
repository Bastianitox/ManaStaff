import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IniciosoliPage } from './iniciosoli.page';

describe('IniciosoliPage', () => {
  let component: IniciosoliPage;
  let fixture: ComponentFixture<IniciosoliPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IniciosoliPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
