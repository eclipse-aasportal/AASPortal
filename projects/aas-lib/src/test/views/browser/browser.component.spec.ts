/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AASDocument } from 'aas-core';
import { DocumentsService } from '../../../lib/services/documents.service';
import { BrowserComponent } from '../../../lib/views/browser/browser.component';
import { encodeBase64Url } from '../../../lib/utilities';

describe('BrowserComponent', () => {
    let component: BrowserComponent;
    let fixture: ComponentFixture<BrowserComponent>;
    let api: jasmine.SpyObj<DocumentsService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<DocumentsService>(['getDocument']);
        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { queryParams: of({ endpoint: encodeBase64Url('endpoint'), id: encodeBase64Url('http://localhost/aas') }) },
        );

        api.getDocument.and.returnValue(
            of({
                address: '',
                crc32: 0,
                idShort: '',
                readonly: false,
                timestamp: 0,
                id: 'http://localhost/aas',
                endpoint: 'endpoint',
            } satisfies AASDocument),
        );

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                {
                    provide: DocumentsService,
                    useValue: api,
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
