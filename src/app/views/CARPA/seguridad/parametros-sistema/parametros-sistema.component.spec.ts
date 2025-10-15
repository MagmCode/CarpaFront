import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametrosSistemaComponent } from './parametros-sistema.component';

describe('ParametrosSistemaComponent', () => {
  let component: ParametrosSistemaComponent;
  let fixture: ComponentFixture<ParametrosSistemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParametrosSistemaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParametrosSistemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
