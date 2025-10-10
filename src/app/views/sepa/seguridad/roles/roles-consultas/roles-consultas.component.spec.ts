import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesConsultasComponent } from './roles-consultas.component';

describe('RolesConsultasComponent', () => {
  let component: RolesConsultasComponent;
  let fixture: ComponentFixture<RolesConsultasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesConsultasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
