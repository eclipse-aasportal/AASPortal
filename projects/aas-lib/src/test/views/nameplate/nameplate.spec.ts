import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nameplate } from '../../../lib/views/nameplate/nameplate';

describe('Nameplate', () => {
  let component: Nameplate;
  let fixture: ComponentFixture<Nameplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nameplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nameplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
