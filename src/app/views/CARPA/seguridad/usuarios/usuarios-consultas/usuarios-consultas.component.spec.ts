import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosConsultasComponent } from './usuarios-consultas.component';

describe('UsuariosConsultasComponent', () => {
  let component: UsuariosConsultasComponent;
  let fixture: ComponentFixture<UsuariosConsultasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsuariosConsultasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuariosConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
