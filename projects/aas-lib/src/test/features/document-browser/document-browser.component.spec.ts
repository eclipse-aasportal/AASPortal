/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { DocumentsService } from '../../../lib/services/documents.service';
import { DocumentBrowserComponent } from '../../../lib/features/document-browser/document-browser.component';
import { encodeBase64Url } from '../../../lib/utilities';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
    provideZonelessChangeDetection,
    signal,
} from '@angular/core';
import { BrowserComponent, BrowserItem } from '../../../lib/components/browser/browser.component';
import { AuthService } from '../../../lib/features/auth/auth.service';
import { StartService } from '../../../lib/services/start.service';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { WINDOW } from '../../../lib/services/window.service';
import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';

@Component({
    selector: 'fhg-browser',
    template: '<div></div>',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestBrowserComponent {
    public readonly document = input<AASDocument | null | undefined>(undefined);
    public readonly open = output<BrowserItem>();
}

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSecuredImageComponent {
    public readonly src = input<string>('');
    public readonly alt = input<string | undefined>();
    public readonly class = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
}

describe('DocumentBrowserComponent', () => {
    let api: jasmine.SpyObj<DocumentsService>;
    let route: jasmine.SpyObj<ActivatedRoute>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;
    let window: jasmine.SpyObj<Window>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<DocumentsService>(['getDocument']);
        auth = jasmine.createSpyObj<AuthService>({}, { token: signal<string | undefined>('Token').asReadonly() });
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
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

        window = jasmine.createSpyObj<Window>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

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
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: DocumentsService,
                    useValue: api,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [
                DocumentBrowserComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(DocumentBrowserComponent, {
            remove: {
                imports: [BrowserComponent, SecuredImageComponent],
            },
            add: {
                imports: [TestBrowserComponent, TestSecuredImageComponent],
            },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(DocumentBrowserComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
