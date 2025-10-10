import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesAccionesComponent } from './roles-acciones.component';

describe('RolesAccionesComponent', () => {
  let component: RolesAccionesComponent;
  let fixture: ComponentFixture<RolesAccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesAccionesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesAccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
