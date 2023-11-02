import { TestBed } from '@angular/core/testing';

import { AASProviderService } from '../../lib/aas-provider/aas-provider.service';

describe('AASProviderService', () => {
    let service: AASProviderService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AASProviderService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
