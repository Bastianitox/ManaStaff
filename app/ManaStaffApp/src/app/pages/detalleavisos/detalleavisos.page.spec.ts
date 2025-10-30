import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleavisosPage } from './detalleavisos.page';

describe('DetalleavisosPage', () => {
  let component: DetalleavisosPage;
  let fixture: ComponentFixture<DetalleavisosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleavisosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
