import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamKitCustomize } from './team-kit-customize';

describe('TeamKitCustomize', () => {
  let component: TeamKitCustomize;
  let fixture: ComponentFixture<TeamKitCustomize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamKitCustomize]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamKitCustomize);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
