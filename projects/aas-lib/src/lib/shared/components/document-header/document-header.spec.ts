/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AASDocument, aas } from 'aas-core';
import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { DocumentHeader, QR_CODE } from './document-header';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { WINDOW } from '../../services/window.service';

describe('DocumentHeader', () => {
    let component: DocumentHeader;
    let fixture: ComponentFixture<DocumentHeader>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: QR_CODE,
                    useValue: { toCanvas: vi.fn() },
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            imports: [DocumentHeader],
        }).compileComponents();

        fixture = TestBed.createComponent(DocumentHeader);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display fallback values when no document is provided', () => {
        fixture.detectChanges();

        expect(component.idShort()).toBe('');
        expect(component.id()).toBe('');
        expect(component.assetId()).toBe('');
        expect(component.version()).toBe('-');
        expect(component.thumbnail()).toBe('/assets/resources/aas-idta.png');
    });

    it('should expose the document details and thumbnail URL', () => {
        const document = createDocument({ version: '1.0', revision: '2' });
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();

        expect(component.idShort()).toBe('Test shell');
        expect(component.id()).toBe('urn:example:aas:one');
        expect(component.assetId()).toBe('urn:example:asset:one');
        expect(component.version()).toBe('1.0 (2)');
        expect(component.thumbnail()).toBe(
            '/api/v1/endpoints/aHR0cHM6Ly9leGFtcGxlLmNvbS9hcGk/documents/dXJuOmV4YW1wbGU6YWFzOm9uZQ/thumbnail',
        );
    });

    it('should display a revision without parentheses when the version is absent', () => {
        fixture.componentRef.setInput('document', createDocument({ revision: '2' }));
        fixture.detectChanges();

        expect(component.version()).toBe('2');
    });

    it('should use the fallback thumbnail after an image error', () => {
        fixture.componentRef.setInput('document', createDocument());
        fixture.detectChanges();

        const image: HTMLImageElement = fixture.nativeElement.querySelector('img');
        image.dispatchEvent(new Event('error'));

        expect(component.thumbnail()).toBe('/assets/resources/aas-idta.png');
    });

    function createDocument(administration?: aas.AdministrativeInformation): AASDocument {
        const shell = createSpyObj<aas.AssetAdministrationShell>([], {
            administration,
            assetInformation: { assetKind: 'Instance' },
            id: 'urn:example:aas:one',
            idShort: 'Test shell',
            modelType: 'AssetAdministrationShell',
        });

        return {
            address: 'https://example.com/aas',
            assetId: 'urn:example:asset:one',
            content: {
                assetAdministrationShells: [shell],
                submodels: [],
            },
            endpoint: 'https://example.com/api',
            id: 'urn:example:aas:one',
            idShort: 'Test shell',
            timestamp: 0,
        };
    }
});
