import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AASPropertyGridComponent } from '../../lib/aas-property-grid/aas-property-grid.component';

describe('AASPropertyGridComponent', () => {
    let component: AASPropertyGridComponent;
    let fixture: ComponentFixture<AASPropertyGridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AASPropertyGridComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AASPropertyGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
