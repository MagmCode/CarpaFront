import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrazasComponent } from './trazas.component';

describe('TrazasComponent', () => {
  let component: TrazasComponent;
  let fixture: ComponentFixture<TrazasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrazasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrazasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
