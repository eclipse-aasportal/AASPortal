import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentPopupComponent } from './document-popup.component';

describe('DocumentPopupComponent', () => {
  let component: DocumentPopupComponent;
  let fixture: ComponentFixture<DocumentPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
