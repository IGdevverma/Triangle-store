import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerRegistration } from './dealer-registration';

describe('DealerRegistration', () => {
  let component: DealerRegistration;
  let fixture: ComponentFixture<DealerRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealerRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
