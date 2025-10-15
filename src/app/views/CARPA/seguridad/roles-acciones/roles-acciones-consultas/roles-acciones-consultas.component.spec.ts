import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesAccionesConsultasComponent } from './roles-acciones-consultas.component';

describe('RolesAccionesConsultasComponent', () => {
  let component: RolesAccionesConsultasComponent;
  let fixture: ComponentFixture<RolesAccionesConsultasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesAccionesConsultasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesAccionesConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
