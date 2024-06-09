/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { WindowService, ViewMode, AuthService, NotifyService, DownloadService, AASTableComponent } from 'aas-lib';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';
import { AASDocument, aas } from 'common';

import { StartComponent } from '../../app/start/start.component';
import { StartApiService } from '../../app/start/start-api.service';
import { FavoritesList, FavoritesService } from '../../app/start/favorites.service';
import { ToolbarService } from '../../app/toolbar.service';
import { provideRouter } from '@angular/router';

@Component({
    selector: 'fhg-aas-table',
    template: '<div></div>',
    styleUrls: [],
    standalone: true,
})
class TestAASTableComponent {
    @Input()
    public viewMode: Observable<ViewMode> | null = null;
    @Input()
    public documents: Observable<AASDocument[]> | null = null;
    @Output()
    public selectedChange = new EventEmitter<AASDocument[]>();
    @Input()
    public selected: AASDocument[] = [];
    @Input()
    public filter: Observable<string> | null = null;
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
            'reset',
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

        auth = jasmine.createSpyObj<AuthService>(['ensureAuthorized'], { ready: of(true) });

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
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: of(null) }),
                },
                provideHttpClientTesting(),
                provideRouter([]),
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
