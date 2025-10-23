/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { first, of } from 'rxjs';
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
    AASTable,
    StartService,
    IndexChangeService,
    EndpointsApi,
    ToolbarService,
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
    let fixture: ComponentFixture<ShellsComponent>;
    let component: ShellsComponent;
    let localStorage: jest.Mocked<Storage>;
    let api: jest.Mocked<EndpointsApi>;
    let favorites: jest.Mocked<FavoritesService>;
    let auth: jest.Mocked<AuthService>;
    let start: jest.Mocked<StartService>;
    let indexChange: jest.Mocked<IndexChangeService>;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        localStorage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);
        localStorage.getItem.mockReturnValue(null);
        api = createSpyObj<EndpointsApi>([
            'addEndpoint',
            'deleteDocument',
            'getEndpoints',
            'removeEndpoint',
            'getContent',
            'getHierarchy',
            'getDocuments',
            'downloadPackage',
        ]);
        api.getDocuments.mockReturnValue(
            of({
                previous: null,
                next: null,
                documents: [],
            }),
        );

        api.getContent.mockReturnValue(
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
                    provide: EndpointsApi,
                    useValue: api,
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

        fixture = TestBed.createComponent(ShellsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.files()).toBeUndefined();
        expect(component.limit()).toBe(10);
        expect(component.favoritesLists()).toEqual(['']);
        expect(component.activeFavoritesList()).toBe('');
        expect(component.selected()).toEqual([]);
        expect(component.someSelected()).toBe(false);
        expect(component.views().length).toBeGreaterThan(0);
        expect(component.filter()).toBe('');
        expect(component.filterText()).toBe('');
        expect(component.documents()).toEqual([]);
        expect(component.isFirstPage()).toBe(true);
        expect(component.isLastPage()).toBe(true);
    });
});
