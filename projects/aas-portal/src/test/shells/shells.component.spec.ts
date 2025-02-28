/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, model, signal } from '@angular/core';
import {
    WINDOW,
    ViewMode,
    AuthService,
    NotifyService,
    DownloadService,
    AASTableComponent,
    StartService,
} from 'aas-lib';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AASDocument, aas } from 'aas-core';

import { ShellsComponent } from '../../app/shells/shells.component';
import { ShellsApiService } from '../../app/shells/shells-api.service';
import { FavoritesList, FavoritesService } from '../../app/shells/favorites.service';
import { ToolbarService } from '../../../../aas-lib/src/lib/toolbar.service';

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

describe('ShellsComponent', () => {
    let window: jasmine.SpyObj<Window>;
    let localStorage: jasmine.SpyObj<Storage>;
    let api: jasmine.SpyObj<ShellsApiService>;
    let component: ShellsComponent;
    let fixture: ComponentFixture<ShellsComponent>;
    let favorites: jasmine.SpyObj<FavoritesService>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;

    beforeEach(() => {
        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        localStorage = jasmine.createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);

        localStorage.getItem.and.returnValue(null);
        window = jasmine.createSpyObj<Window>(['addEventListener', 'confirm'], { localStorage });

        api = jasmine.createSpyObj<ShellsApiService>([
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
                    provide: ShellsApiService,
                    useValue: api,
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
                }
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

        TestBed.overrideComponent(ShellsComponent, {
            remove: {
                imports: [AASTableComponent],
            },
            add: {
                imports: [TestAASTableComponent],
            },
        });

        fixture = TestBed.createComponent(ShellsComponent);
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
