/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { IndexChange } from 'aas-lib';
import { AboutCardComponent } from './about-card.component';
import { createSpyObj } from '../../test/mocks';

describe('AboutCardComponent', () => {
    let indexChange: Mocked<IndexChange>;

    beforeEach(async () => {
        indexChange = createSpyObj<IndexChange>({}, { documentCount: signal(42), endpointCount: signal(2) });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: IndexChange,
                    useValue: indexChange,
                },
                provideTranslateService(),
            ],
            imports: [AboutCardComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AboutCardComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
