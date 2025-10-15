import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesAplicacionComponent } from './reportes-aplicacion.component';

describe('ReportesAplicacionComponent', () => {
  let component: ReportesAplicacionComponent;
  let fixture: ComponentFixture<ReportesAplicacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportesAplicacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesAplicacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
