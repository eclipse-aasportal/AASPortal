/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Library } from 'common';

import { LibraryTableComponent } from '../../lib/library-table/library-table.component';

describe('LibraryTableComponent', () => {
    let component: LibraryTableComponent;
    let fixture: ComponentFixture<LibraryTableComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    defaultLanguage: 'en-us',
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(LibraryTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('has an initial page size of 10', function () {
        expect(component.pageSize).toEqual(10);
    });

    it('shows page 1', function () {
        expect(component.page).toEqual(1);
    });

    describe('with pagination', function () {
        let size: number;

        beforeEach(function () {
            const collection: Library[] = [];

            size = component.pageSize + 1;
            for (let i = 1; i <= size; i++) {
                collection.push({
                    name: 'Library ' + i,
                    description: 'Description library ' + i,
                    license: 'MIT',
                    homepage: 'https://www.fraunhofer.de',
                    version: '1.' + i,
                });
            }

            component.collection = collection;
            fixture.detectChanges();

            component.ngOnChanges({
                collection: new SimpleChange([], collection, true),
            });
        });

        it('has 11 libraries', function () {
            expect(component.size).toEqual(size);
        });

        it('displays the first page with 10 entries', function () {
            expect(component.libraries.length).toEqual(component.pageSize);
        });

        it('provides 2 pages', function () {
            expect(component.page).toEqual(1);
            expect(component.libraries.length).toEqual(10);

            component.page = 2;
            fixture.detectChanges();
            component.refreshLibraries();
            expect(component.libraries.length).toEqual(1);
        });
    });

    describe('show/hide pagination', function () {
        let size: number;

        beforeEach(function () {
            const collection: Library[] = [];

            size = 10;
            for (let i = 1; i <= size; i++) {
                collection.push({
                    name: 'Library ' + i,
                    description: 'Description library ' + i,
                    license: 'MIT',
                    homepage: 'https://www.fraunhofer.de',
                    version: '1.' + i,
                });
            }

            component.collection = collection;
            fixture.detectChanges();

            component.ngOnChanges({
                collection: new SimpleChange([], collection, true),
            });
        });

        it('hides pagination if size <= pageSize', function () {
            component.pageSize = component.size;
            fixture.detectChanges();
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement | null = element.querySelector('ngb-pagination');
            expect(pagination).toBeNull();
        });

        it('shows pagination if size > pageSize', function () {
            component.pageSize = component.size - 1;
            fixture.detectChanges();
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement | null = element.querySelector('ngb-pagination');
            expect(pagination).toBeDefined();
        });
    });
});
