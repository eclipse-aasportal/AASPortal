/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    model,
    provideZonelessChangeDetection,
    signal,
} from '@angular/core';

import { AASDocument, aas } from 'aas-core';
import {
    ViewMode,
    AuthService,
    NotifyService,
    AASTable,
    StartService,
    EndpointsApi,
    ToolbarService,
} from 'aas-lib';

import { ShellsComponent } from '../../app/shells/shells.component';
import { FavoritesList, FavoritesService } from '../../app/shells/favorites.service';
import { createSpyObj, FakeLoader } from '../mocks';
import { ShellsState } from '../../app/shells/shells.state';

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
    public readonly expression = input('');
}

describe('ShellsComponent', () => {
    let fixture: ComponentFixture<ShellsComponent>;
    let component: ShellsComponent;
    let localStorage: Mocked<Storage>;
    let api: Mocked<EndpointsApi>;
    let favorites: Mocked<FavoritesService>;
    let auth: Mocked<AuthService>;
    let start: Mocked<StartService>;
    let httpClient: Mocked<HttpClient>;
    let state: ShellsState;

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
            'downloadPackage',
        ]);

        api.getContent.mockReturnValue(
            of({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } as aas.Environment),
        );

        favorites = createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove', 'save', 'setActive'], {
            active: signal(''),
            items: signal<FavoritesList[]>([{ name: 'List 1', documents: [] }, { name: 'List 2', documents: [] }]),
        });

        favorites.save.mockReturnValue(of(void 0));

        auth = createSpyObj<AuthService>(['ensureAuthorized', 'getCookie', 'setCookie'], {
            ready: of(true),
        });

        auth.getCookie.mockReturnValue(of(undefined));
        auth.setCookie.mockReturnValue(of(undefined));

        httpClient = createSpyObj<HttpClient>(['get', 'post', 'put', 'delete', 'request']);
        httpClient.get.mockReturnValue(of({}));
        httpClient.request.mockReturnValue(of({}));

        await TestBed.configureTestingModule({
            providers: [
                { 
                    provide: HttpClient, 
                    useValue: httpClient 
                },
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
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [ShellsComponent],
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
        state = TestBed.inject(ShellsState);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.files()).toBeUndefined();
        expect(component.limit()).toBe(10);
        expect(component.favoritesLists()).toEqual(['', 'List 1', 'List 2']);
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

    it('should update filter', () => {
        component.setFilterText('test');
        expect(component.filterText()).toBe('test');
    });

    it('should update limit', () => {
        component.setLimit(20);
        expect(component.limit()).toBe(20);
    });

    it('should update selected documents', () => {
        const doc1: AASDocument = { id: '1', idShort: 'Doc 1' } as AASDocument;
        const doc2: AASDocument = { id: '2', idShort: 'Doc 2' } as AASDocument;
        component.setSelected([doc1, doc2]);
        expect(component.selected()).toEqual([doc1, doc2]);
        expect(component.someSelected()).toBe(true);
    });

    it('select favorites list', () => {
        component.setActiveFavoriteList('List 1');
        expect(favorites.setActive).toHaveBeenCalledWith('List 1');
        expect(favorites.save).toHaveBeenCalled();
    });
});
