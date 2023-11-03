/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { WindowService, AASLibModule, ViewMode } from 'projects/aas-lib/src/public-api';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASContainer, AASDocument, AASWorkspace } from 'common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EffectsModule } from '@ngrx/effects';

import * as ws from '../../test/assets/test-document';
import { startReducer } from '../../app/start/start.reducer';
import { StartComponent } from '../../app/start/start.component';
import { StartState } from '../../app/start/start.state';
import { ProjectService } from '../../app/project/project.service';

class TestProjectService implements Partial<ProjectService> {
    constructor(
        private _containers: AASContainer[],
        private _workspaces: AASWorkspace[],
        private _workspace: AASWorkspace
    ) { }

    public get containers(): Observable<AASContainer[]> {
        return of(this._containers);
    }

    public get workspace(): Observable<AASWorkspace | null> {
        return of(this._workspace);
    }

    public get workspaces(): Observable<AASWorkspace[]> {
        return of(this._workspaces);
    }

    public get document(): Observable<AASDocument | null> {
        return of(null);
    }

    public get documents(): Observable<AASDocument[]> {
        return of(this._workspace.containers.flatMap(item => item.documents ?? []));
    }

    public setDocument(): Observable<void> {
        return new Observable<void>();
    }
}

describe('StartComponent', () => {
    let store: Store<{ start: StartState }>;
    let window: jasmine.SpyObj<WindowService>;
    let component: StartComponent;
    let fixture: ComponentFixture<StartComponent>;
    let document1: AASDocument;
    let document2: AASDocument;
    let document3: AASDocument;
    let container1: AASContainer;
    let container2: AASContainer;
    let ws1: AASWorkspace;
    let ws2: AASWorkspace;

    beforeEach(() => {
        window = jasmine.createSpyObj<WindowService>(['confirm', 'getLocalStorageItem', 'setLocalStorageItem', 'removeLocalStorageItem']);
        document1 = ws.createDocument('document1');
        document2 = ws.createDocument('document2');
        document3 = ws.createDocument('document3');
        container1 = ws.createContainer('https:/www.fraunhofer.de/container1', [document1, document2]);
        container2 = ws.createContainer('https:/www.fraunhofer.de/container2', [document3]);
        ws1 = ws.createWorkspace('WS1', [container1]);
        ws2 = ws.createWorkspace('WS2', [container2]);

        TestBed.configureTestingModule({
            declarations: [
                StartComponent
            ],
            providers: [
                {
                    provide: ProjectService,
                    useValue: new TestProjectService([container1, container2], [ws1, ws2], ws1),
                },
                {
                    provide: WindowService,
                    useValue: window,
                }
            ],
            imports: [
                NgbModule,
                RouterModule,
                HttpClientTestingModule,
                AASLibModule,
                EffectsModule.forRoot(),
                StoreModule.forRoot({
                    start: startReducer
                }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ],
        });

        store = TestBed.inject(Store);
        fixture = TestBed.createComponent(StartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides workspaces', function () {
        expect(component.workspaces).toEqual([ws1, ws2]);
    });

    it('initial view mode is "list"', function () {
        expect(component.viewMode).toEqual(ViewMode.List);
    });

    it('indicates whether all AAS documents have content', function () {
        expect(component.allAvailable).toBeTrue();
    });

    it('sets "tree" view mode', function () {
        component.setViewMode(ViewMode.Tree);
        store.subscribe(state => expect(state.start.viewMode).toEqual(ViewMode.Tree));
    });
});