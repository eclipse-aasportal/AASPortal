/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, model, signal } from '@angular/core';
import { WindowService, ViewMode, AuthService, NotifyService, DownloadService, AASTableComponent } from 'aas-lib';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AASDocument, aas } from 'aas-core';

import { StartComponent } from '../../app/start/start.component';
import { StartApiService } from '../../app/start/start-api.service';
import { FavoritesList, FavoritesService } from '../../app/start/favorites.service';
import { ToolbarService } from '../../app/toolbar.service';

@Component({
    selector: 'fhg-aas-table',
    template: '<div></div>',
    styleUrls: [],
    standalone: true,
})
class TestAASTableComponent {
    public readonly viewMode = input<ViewMode>(ViewMode.List);
    public readonly documents = input<AASDocument[]>([]);
    public readonly selected = model<AASDocument[]>([]);
    public readonly filter = input('');
}

describe('StartComponent', () => {
    let window: jasmine.SpyObj<WindowService>;
    let api: jasmine.SpyObj<StartApiService>;
    let component: StartComponent;
    let fixture: ComponentFixture<StartComponent>;
    let favorites: jasmine.SpyObj<FavoritesService>;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        window = jasmine.createSpyObj<WindowService>([
            'addEventListener',
            'confirm',
            'getLocalStorageItem',
            'setLocalStorageItem',
            'removeEventListener',
            'removeLocalStorageItem',
        ]);

        api = jasmine.createSpyObj<StartApiService>([
            'addEndpoint',
            'delete',
            'getContent',
            'getEndpoints',
            'getHierarchy',
            'getPage',
            'removeEndpoint',
        ]);

        api.getPage.and.returnValue(
            of({
                previous: null,
                next: null,
                documents: [],
            }),
        );

        api.getContent.and.returnValue(
            of({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } as aas.Environment),
        );

        favorites = jasmine.createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove'], {
            lists: signal<FavoritesList[]>([]),
        });

        auth = jasmine.createSpyObj<AuthService>(['ensureAuthorized', 'getCookie', 'setCookie'], {
            userId: of('guest'),
        });

        auth.getCookie.and.returnValue(of(undefined));
        auth.setCookie.and.returnValue(of(undefined));

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: StartApiService,
                    useValue: api,
                },
                {
                    provide: WindowService,
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
                    useValue: jasmine.createSpyObj<DownloadService>(['downloadDocument']),
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
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
        });

        TestBed.overrideComponent(StartComponent, {
            remove: {
                imports: [AASTableComponent],
            },
            add: {
                imports: [TestAASTableComponent],
            },
        });

        fixture = TestBed.createComponent(StartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('initial view mode is "list"', function (done: DoneFn) {
    //     component.viewMode.pipe(first()).subscribe(value => {
    //         expect(value).toEqual(ViewMode.List);
    //         done();
    //     });
    // });

    // it('sets "tree" view mode', function () {
    //     component.setViewMode(ViewMode.Tree);
    //     store.subscribe(state => expect(state.start.viewMode).toEqual(ViewMode.Tree));
    // });
});
