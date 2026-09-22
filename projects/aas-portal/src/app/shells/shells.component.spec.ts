/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, input, model, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';

import { AASDocument, aas } from 'aas-core';
import {
    ViewMode,
    AuthService,
    NotifyService,
    AASTable,
    StartService,
    EndpointsApi,
    ToolbarService,
    CookieService,
} from 'aas-lib';

import { ShellsComponent } from './shells.component';
import { FavoritesList, FavoritesService } from './favorites.service';
import { ShellsState } from './shells.state';
import { createSpyObj, FakeLoader } from '../../test/mocks';

@Component({
    selector: 'fhg-aas-table',
    template: '<div></div>',
    styleUrls: [],
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
    let cookies: Mocked<CookieService>;
    let start: Mocked<StartService>;
    let httpClient: Mocked<HttpClient>;
    let auth: Mocked<AuthService>;
    let modal: Mocked<NgbModal>;
    let activeFavorites: ReturnType<typeof signal<string>>;
    let isAuthenticated: WritableSignal<boolean>;
    let state: ShellsState;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        localStorage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);
        localStorage.getItem.mockReturnValue(null);
        api = createSpyObj<EndpointsApi>([
            'addEndpoint',
            'deletePackage',
            'getEndpoints',
            'removeEndpoint',
            'getContent',
            'downloadPackage',
            'uploadPackage',
        ]);

        api.getContent.mockReturnValue(
            of({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } as aas.Environment),
        );
        api.deletePackage.mockReturnValue(of(void 0));

        activeFavorites = signal('');
        favorites = createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove', 'save', 'setActive'], {
            active: activeFavorites,
            items: signal<FavoritesList[]>([
                { name: 'List 1', documents: [] },
                { name: 'List 2', documents: [] },
            ]),
        });

        favorites.save.mockReturnValue(of(void 0));

        cookies = createSpyObj<CookieService>(['getCookie', 'setCookie']);
        cookies.getCookie.mockReturnValue(of(undefined));
        cookies.setCookie.mockReturnValue(of(undefined));

        httpClient = createSpyObj<HttpClient>(['get', 'post', 'put', 'delete', 'request']);
        httpClient.get.mockReturnValue(of({}));
        httpClient.request.mockReturnValue(of({}));

        isAuthenticated = signal(false);
        auth = createSpyObj<AuthService>(['checkAuthorized'], {
            ready: of(true),
            isAuthenticated,
            name: signal(''),
            user: signal(undefined),
        });
        auth.checkAuthorized.mockReturnValue(of(void 0));

        modal = createSpyObj<NgbModal>(['open']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: HttpClient,
                    useValue: httpClient,
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
                    provide: CookieService,
                    useValue: cookies,
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
                    provide: NgbModal,
                    useValue: modal,
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
        state = TestBed.inject(ShellsState);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.files()).toBeUndefined();
        expect(component.limit()).toBe(10);
        expect(component.favoritesLists()).toEqual(['', 'List 1', 'List 2']);
        expect(component.activeFavoritesList()).toBe('');
        expect(component.selected()).toEqual([]);
        expect(component.someSelected()).toBe(false);
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

    it('deletes the documents selected when deletion begins', async () => {
        const selectedDocument = { id: '1', idShort: 'Selected', endpoint: 'endpoint-a' } as AASDocument;
        const laterDocument = { id: '2', idShort: 'Later', endpoint: 'endpoint-b' } as AASDocument;
        activeFavorites.set('List 1');
        component.setSelected([selectedDocument]);

        const deletion = component.deletePackages();
        component.setSelected([laterDocument]);
        await firstValueFrom(deletion);
        expect(favorites.remove).toHaveBeenCalledExactlyOnceWith([selectedDocument], 'List 1');
        expect(component.selected()).toEqual([]);
    });

    it('resets pagination when endpoint visibility changes', () => {
        state.update({ position: { next: 'next' as never, previous: undefined } });

        component.toggleCheckEndpoint(true, { name: 'endpoint-a', checked: false, locked: false });

        expect(state.position()).toEqual({ next: undefined, previous: null });
    });

    it('continues downloading after an individual package download fails', async () => {
        const firstDocument = { id: '1', idShort: 'First', endpoint: 'endpoint-a' } as AASDocument;
        const secondDocument = { id: '2', idShort: 'Second', endpoint: 'endpoint-a' } as AASDocument;
        isAuthenticated.set(true);
        api.downloadPackage.mockImplementation((_, id) =>
            id === firstDocument.id ? throwError(() => new Error('Download failed')) : of(void 0),
        );
        component.setSelected([firstDocument, secondDocument]);

        await firstValueFrom(component.downloadPackages(), { defaultValue: undefined });

        expect(api.downloadPackage).toHaveBeenCalledTimes(2);
    });

    it('does not request authorization when no document is selected for deletion', async () => {
        await firstValueFrom(component.deletePackages(), { defaultValue: undefined });
        expect(auth.checkAuthorized).not.toHaveBeenCalled();
    });
});
