/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
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
    ViewMode,
    AuthService,
    NotifyService,
    DownloadService,
    AASTable,
    StartService,
    IndexChangeService,
    EndpointsApi,
    ToolbarService,
    EndpointsService,
} from 'aas-lib';

import { ShellsComponent } from '../../app/shells/shells.component';
import { FavoritesList, FavoritesService } from '../../app/shells/favorites.service';
import { createSpyObj, FakeLoader } from '../mocks';

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
    let localStorage: jest.Mocked<Storage>;
    let endpoints: jest.Mocked<EndpointsService>;
    let documents: jest.Mocked<EndpointsApi>;
    let favorites: jest.Mocked<FavoritesService>;
    let auth: jest.Mocked<AuthService>;
    let start: jest.Mocked<StartService>;
    let indexChange: jest.Mocked<IndexChangeService>;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        localStorage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);
        localStorage.getItem.mockReturnValue(null);
        endpoints = createSpyObj<EndpointsService>(['addEndpoint', 'delete', 'getEndpoints', 'removeEndpoint']);
        documents = createSpyObj<EndpointsApi>(['getContent', 'getHierarchy', 'getDocuments']);
        documents.getDocuments.mockReturnValue(
            of({
                previous: null,
                next: null,
                documents: [],
            }),
        );

        documents.getContent.mockReturnValue(
            of({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } as aas.Environment),
        );

        favorites = createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove'], {
            active: signal(''),
            items: signal<FavoritesList[]>([]),
        });

        auth = createSpyObj<AuthService>(['ensureAuthorized', 'getCookie', 'setCookie'], {
            ready: of(true),
        });

        auth.getCookie.mockReturnValue(of(undefined));
        auth.setCookie.mockReturnValue(of(undefined));

        indexChange = createSpyObj<IndexChangeService>(
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
                    provide: FavoritesService,
                    useValue: favorites,
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: DownloadService,
                    useValue: createSpyObj<DownloadService>(['downloadPackage']),
                },
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
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
                        useClass: FakeLoader,
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
