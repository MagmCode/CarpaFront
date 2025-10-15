import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesMenuConsultasComponent } from './roles-menu-consultas.component';

describe('RolesMenuConsultasComponent', () => {
  let component: RolesMenuConsultasComponent;
  let fixture: ComponentFixture<RolesMenuConsultasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesMenuConsultasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesMenuConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
