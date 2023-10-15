/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { ToolbarService } from '../app/toolbar.service';
import { TemplateRef } from '@angular/core';
import { first } from 'rxjs';

describe('ToolbarService', () => {
    let service: ToolbarService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToolbarService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('sets a new toolbar', function(done: DoneFn) {
        const template = jasmine.createSpyObj<TemplateRef<unknown>>(['createEmbeddedView']);
        service.set(template);
        service.toolbarTemplate.pipe(first(value => value !== null)).subscribe(value => {
            expect(value).toEqual(template);
            done();
        })
    });

    it('removes a toolbar', function(done: DoneFn) {
        service.clear();
        service.toolbarTemplate.pipe(first()).subscribe(value => {
            expect(value).toBeNull();
            done();
        })
    });
});