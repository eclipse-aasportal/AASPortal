/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL, ToolbarService } from 'aas-lib';

import { ConceptDescriptionsComponent } from './concept-descriptions.component';
import { createSpyObj } from '../../test/mocks';
import { ApiUrlService } from '../api-url.service';

describe('ConceptDescriptionsComponent', () => {
    let component: ConceptDescriptionsComponent;
    let fixture: ComponentFixture<ConceptDescriptionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear']),
                },
                {
                    provide: API_URL,
                    useValue: createSpyObj<ApiUrlService>(['join']),
                },
                provideRouter([]),
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [],
        }).compileComponents();

        fixture = TestBed.createComponent(ConceptDescriptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
