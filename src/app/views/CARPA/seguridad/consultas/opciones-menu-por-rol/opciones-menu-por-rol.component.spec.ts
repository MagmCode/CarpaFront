import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcionesMenuPorRolComponent } from './opciones-menu-por-rol.component';

describe('OpcionesMenuPorRolComponent', () => {
  let component: OpcionesMenuPorRolComponent;
  let fixture: ComponentFixture<OpcionesMenuPorRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpcionesMenuPorRolComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpcionesMenuPorRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
