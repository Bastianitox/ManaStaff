import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IniciodocPage } from './iniciodoc.page';

describe('IniciodocPage', () => {
  let component: IniciodocPage;
  let fixture: ComponentFixture<IniciodocPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IniciodocPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
