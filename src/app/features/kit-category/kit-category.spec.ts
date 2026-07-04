import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitCategory } from './kit-category';

describe('KitCategory', () => {
  let component: KitCategory;
  let fixture: ComponentFixture<KitCategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitCategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KitCategory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
