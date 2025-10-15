import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcionesMenuPorUrlComponent } from './opciones-menu-por-url.component';

describe('OpcionesMenuPorUrlComponent', () => {
  let component: OpcionesMenuPorUrlComponent;
  let fixture: ComponentFixture<OpcionesMenuPorUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpcionesMenuPorUrlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpcionesMenuPorUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
