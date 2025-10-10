import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccionesBuscarComponent } from './acciones-buscar.component';

describe('AccionesBuscarComponent', () => {
  let component: AccionesBuscarComponent;
  let fixture: ComponentFixture<AccionesBuscarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccionesBuscarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccionesBuscarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
