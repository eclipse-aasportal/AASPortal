/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    model,
    provideZonelessChangeDetection,
    signal,
} from '@angular/core';

import { AASDocument, WebSocketData, aas } from 'aas-core';
import {
    WINDOW,
    ViewMode,
    AuthService,
    NotifyService,
    DownloadService,
    AASTable,
    StartService,
    IndexChangeService,
    EndpointsApi,
    ToolbarService,
} from 'aas-lib';

import { ShellsComponent } from '../../app/shells/shells.component';
import { EndpointsService } from '../../../../aas-lib/src/lib/services/endpoints.service';
import { FavoritesList, FavoritesService } from '../../app/shells/favorites.service';

@Component({
    selector: 'fhg-aas-table',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestAASTable {
    public readonly viewMode = input<ViewMode>(ViewMode.List);
    public readonly documents = input<AASDocument[]>([]);
    public readonly selected = model<AASDocument[]>([]);
    public readonly filter = input('');
}

describe('ShellsComponent', () => {
    let window: jasmine.SpyObj<Window>;
    let localStorage: jasmine.SpyObj<Storage>;
    let endpoints: jasmine.SpyObj<EndpointsService>;
    let documents: jasmine.SpyObj<EndpointsApi>;
    let favorites: jasmine.SpyObj<FavoritesService>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;
    let indexChange: jasmine.SpyObj<IndexChangeService>;

    beforeEach(async () => {
        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        localStorage = jasmine.createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);
        localStorage.getItem.and.returnValue(null);
        window = jasmine.createSpyObj<Window>(['addEventListener', 'confirm'], { localStorage });
        endpoints = jasmine.createSpyObj<EndpointsService>(['addEndpoint', 'delete', 'getEndpoints', 'removeEndpoint']);
        documents = jasmine.createSpyObj<EndpointsApi>(['getContent', 'getHierarchy', 'getDocuments']);
        documents.getDocuments.and.returnValue(
            of({
                previous: null,
                next: null,
                documents: [],
            }),
        );

        documents.getContent.and.returnValue(
            of({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } as aas.Environment),
        );

        favorites = jasmine.createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove'], {
            active: signal(''),
            items: signal<FavoritesList[]>([]),
        });

        auth = jasmine.createSpyObj<AuthService>(['ensureAuthorized', 'getCookie', 'setCookie'], {
            userId: of('guest'),
        });

        auth.getCookie.and.returnValue(of(undefined));
        auth.setCookie.and.returnValue(of(undefined));

        indexChange = jasmine.createSpyObj<IndexChangeService>(
            {},
            {
                message: of({
                    type: 'IndexChange',
                    data: null,
                } satisfies WebSocketData),
            },
        );

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: EndpointsService,
                    useValue: endpoints,
                },
                {
                    provide: EndpointsApi,
                    useValue: documents,
                },
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: FavoritesService,
                    useValue: favorites,
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: DownloadService,
                    useValue: jasmine.createSpyObj<DownloadService>(['downloadPackage']),
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: IndexChangeService,
                    useValue: indexChange,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                ShellsComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(ShellsComponent, {
            remove: {
                imports: [AASTable],
            },
            add: {
                imports: [TestAASTable],
            },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ShellsComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
