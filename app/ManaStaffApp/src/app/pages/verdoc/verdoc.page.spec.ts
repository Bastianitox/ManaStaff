import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerdocPage } from './verdoc.page';

describe('VerdocPage', () => {
  let component: VerdocPage;
  let fixture: ComponentFixture<VerdocPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerdocPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
