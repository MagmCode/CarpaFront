import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultasHilosAbiertosComponent } from './consultas-hilos-abiertos.component';

describe('ConsultasHilosAbiertosComponent', () => {
  let component: ConsultasHilosAbiertosComponent;
  let fixture: ComponentFixture<ConsultasHilosAbiertosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsultasHilosAbiertosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultasHilosAbiertosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
