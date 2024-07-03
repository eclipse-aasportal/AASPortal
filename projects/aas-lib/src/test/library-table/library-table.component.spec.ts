/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Library } from 'aas-core';

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

    it('has an initial page size of 10', () => {
        expect(component.pageSize()).toEqual(10);
    });

    it('shows page 1', () => {
        expect(component.page()).toEqual(1);
    });

    describe('with pagination', () => {
        let size: number;

        beforeEach(() => {
            const collection: Library[] = [];

            size = component.pageSize() + 1;
            for (let i = 1; i <= size; i++) {
                collection.push({
                    name: 'Library ' + i,
                    description: 'Description library ' + i,
                    license: 'MIT',
                    homepage: 'https://www.fraunhofer.de',
                    version: '1.' + i,
                });
            }

            fixture.componentRef.setInput('collection', collection);
            fixture.detectChanges();
        });

        it('has 11 libraries', () => {
            expect(component.size()).toEqual(size);
        });

        it('displays the first page with 10 entries', () => {
            expect(component.libraries().length).toEqual(component.pageSize());
        });

        it('provides 2 pages', () => {
            expect(component.page()).toEqual(1);
            expect(component.libraries().length).toEqual(10);

            component.page.set(2);
            fixture.detectChanges();
            expect(component.libraries().length).toEqual(1);
        });
    });

    describe('show/hide pagination', () => {
        let size: number;

        beforeEach(() => {
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

            fixture.componentRef.setInput('collection', collection);
            fixture.detectChanges();
        });

        it('hides pagination if size <= pageSize', () => {
            fixture.componentRef.setInput('pageSize', component.size);
            fixture.detectChanges();
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement | null = element.querySelector('ngb-pagination');
            expect(pagination).toBeNull();
        });

        it('shows pagination if size > pageSize', () => {
            fixture.componentRef.setInput('pageSize', component.size() - 1);
            fixture.detectChanges();
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement | null = element.querySelector('ngb-pagination');
            expect(pagination).toBeDefined();
        });
    });
});
