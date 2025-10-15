import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcionesDeMenuComponent } from './opciones-de-menu.component';

describe('OpcionesDeMenuComponent', () => {
  let component: OpcionesDeMenuComponent;
  let fixture: ComponentFixture<OpcionesDeMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpcionesDeMenuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpcionesDeMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
