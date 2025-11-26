import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioperfilPage } from './inicioperfil.page';

describe('InicioperfilPage', () => {
  let component: InicioperfilPage;
  let fixture: ComponentFixture<InicioperfilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioperfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
