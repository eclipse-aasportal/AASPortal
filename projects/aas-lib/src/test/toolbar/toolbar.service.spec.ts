/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { first } from 'rxjs';
import { Toolbar } from '../../lib/toolbar/toolbar';
import { ToolbarService } from '../../lib/toolbar/toolbar.service';

describe('ToolbarService', () => {
    let service: ToolbarService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToolbarService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('allows set and reset a specific toolbar', function (done: DoneFn) {
        const toolbar: Toolbar = {
            groups: [
                service.createGroup(
                    [
                        service.createButton('bi bi-gear', () => {}, () => true),
                    ]
                )
            ]
        }

        service.setToolbar(toolbar);
        service.groups.pipe(first()).subscribe(values => {
            expect(values).toEqual(toolbar.groups);
        });

        service.setToolbar();
        service.groups.pipe(first()).subscribe(values => {
            expect(values.length).toEqual(0);
            done();
        });
    });
});