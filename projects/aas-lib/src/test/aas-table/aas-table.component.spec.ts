/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASDocument } from 'common';
import { first, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SimpleChange } from '@angular/core';

import * as ws from '../assets/test-document'
import { AASTableState } from 'src/lib/aas-table/aas-table.state';
import { AASTableComponent } from 'src/lib/aas-table/aas-table.component';
import { NotifyService } from 'src/lib/notify/notify.service';
import { aasTableReducer } from 'src/lib/aas-table/aas-table.reducer';
import { ViewMode } from 'src/lib/types/view-mode';
import { MaxLengthPipe, SortableHeaderDirective } from 'src/public-api';
import { selectState } from 'src/lib/aas-table/aas-table.selectors';

describe('AASTableComponent', () => {
    let store: Store<{ aasTable: AASTableState }>;
    let router: Router;
    let component: AASTableComponent;
    let fixture: ComponentFixture<AASTableComponent>;
    let document1: AASDocument;
    let document2: AASDocument;
    let document3: AASDocument;

    beforeEach(() => {
        document1 = ws.createDocument('document1');
        document2 = ws.createDocument('document2');
        document3 = ws.createDocument('document3');
        document3.modified = true;

        TestBed.configureTestingModule({
            declarations: [
                AASTableComponent,
                MaxLengthPipe,
                SortableHeaderDirective
            ],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log'])
                }
            ],
            imports: [
                CommonModule,
                NgbModule,
                StoreModule.forRoot(
                    {
                        aasTable: aasTableReducer
                    }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        store = TestBed.inject(Store);
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(AASTableComponent);
        component = fixture.componentInstance;
        component.filter = of('');
        component.documents = of([document1, document2, document3]);
        component.ngOnChanges({ 'documents': new SimpleChange(null, component.documents, true) });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('has an initial view mode "List"', function () {
        expect(component.viewMode).toEqual(ViewMode.List);
    });

    it('has an initial showAll "false"', function () {
        expect(component.showAll).toBeFalse();
    });

    it('has initial an empty filter', function (done: DoneFn) {
        component.filter?.pipe(first()).subscribe(value => {
            expect(value).toEqual('');
            done();
        })
    });

    it('provides initial an empty selectedDocuments property', function (done: DoneFn) {
        component.selectedDocuments.pipe(first()).subscribe(documents => {
            expect(documents).toEqual([]);
            done();
        })

    });

    it('provides a rows property', function (done: DoneFn) {
        component.rows.pipe(first()).subscribe(rows => {
            expect(rows).toBeTruthy();
            done();
        });
    });

    it('allows switching to viewMode "Tree"', function (done: DoneFn) {
        component.viewMode = ViewMode.Tree;
        component.ngOnChanges({ viewMode: new SimpleChange(ViewMode.List, ViewMode.Tree, true) });
        store.select(selectState).pipe(first()).subscribe(state => {
            expect(state.viewMode).toEqual(ViewMode.Tree);
            done();
        });
    });

    it('allows switching to showAll "true"', function (done: DoneFn) {
        component.showAll = true;
        component.ngOnChanges({ showAll: new SimpleChange(false, true, true) });
        store.select(selectState).pipe(first()).subscribe(state => {
            expect(state.showAll).toBeTrue();
            done();
        });
});

    it('allows set a filter', function (done: DoneFn) {
        component.filter = of('document');
        component.ngOnChanges({ filter: new SimpleChange(of(''), component.filter, true) });

        component.filter.pipe(first()).subscribe(value => {
            expect(value).toEqual('document');
            done();
        });
    });

    it('allows selecting a row', function (done: DoneFn) {
        const checkbox: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('input[name="document1"]');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        store.select(state => state.aasTable.rows).pipe(first()).subscribe(rows => {
            expect(rows[0].selected).toBeTrue();
            done();
        });
    });

    it('allows selecting all rows', function (done: DoneFn) {
        const checkbox: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#aas-table-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        component.rows.pipe(first()).subscribe(rows => {
            expect(rows.every(row => row.selected)).toBeTrue();
            done();
        });
    });

    it('can navigate to an AAS document', function () {
        spyOn(router, 'navigateByUrl');
        const anchorElement: HTMLAnchorElement = fixture.debugElement.nativeElement.querySelector('a[name="document1"]');
        anchorElement.dispatchEvent(new Event('click'));
        fixture.detectChanges();
        expect(router.navigateByUrl).toHaveBeenCalled();
    });
});