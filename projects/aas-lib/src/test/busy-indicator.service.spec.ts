import { TestBed } from '@angular/core/testing';

import { BusyIndicatorService } from '../lib/busy-indicator.service';

describe('BusyIndicatorService', () => {
    let service: BusyIndicatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BusyIndicatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
