import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CambiarpinPage } from './cambiarpin.page';

describe('CambiarpinPage', () => {
  let component: CambiarpinPage;
  let fixture: ComponentFixture<CambiarpinPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CambiarpinPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
