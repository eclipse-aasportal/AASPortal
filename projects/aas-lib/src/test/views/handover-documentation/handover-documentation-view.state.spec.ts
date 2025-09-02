/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { HandoverDocumentationViewState as HandoverDocumentationViewState } from '../../../lib/views/handover-documentation/handover-documentation-view.state';

describe.skip('HandoverDocumentationVState', () => {
    let service: HandoverDocumentationViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HandoverDocumentationViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
