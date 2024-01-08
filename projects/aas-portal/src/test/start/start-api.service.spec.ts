/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { StartApiService } from '../../app/start/start-api.service';

describe('StartApiService', function () {
    let service: StartApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(function () {

        TestBed.configureTestingModule({
            declarations: [],
            providers: [],
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(StartApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', function () {
        expect(service).toBeTruthy();
    });
});