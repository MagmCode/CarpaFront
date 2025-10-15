import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramadorTareasComponent } from './programador-tareas.component';

describe('ProgramadorTareasComponent', () => {
  let component: ProgramadorTareasComponent;
  let fixture: ComponentFixture<ProgramadorTareasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgramadorTareasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramadorTareasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
