import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosWebBcvComponent } from './servicios-web-bcv.component';

describe('ServiciosWebBcvComponent', () => {
  let component: ServiciosWebBcvComponent;
  let fixture: ComponentFixture<ServiciosWebBcvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiciosWebBcvComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosWebBcvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
