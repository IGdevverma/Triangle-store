import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamKitDesigner } from './team-kit-designer';

describe('TeamKitDesigner', () => {
  let component: TeamKitDesigner;
  let fixture: ComponentFixture<TeamKitDesigner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamKitDesigner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamKitDesigner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
