/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Message } from 'aas-core';
import { MessageTableComponent } from '../../lib/message-table/message-table.component';

describe('MessageTableComponent', () => {
    let component: MessageTableComponent;
    let fixture: ComponentFixture<MessageTableComponent>;
    let collection: Message[];
    const sizePerType = 5;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(MessageTableComponent);
        component = fixture.componentInstance;

        collection = [];
        for (let i = 1; i <= sizePerType; i++) {
            collection.push({
                type: 'Info',
                timestamp: Date.now(),
                text: 'Info' + i,
            });
            collection.push({
                type: 'Warning',
                timestamp: Date.now(),
                text: 'Warning' + i,
            });
            collection.push({
                type: 'Error',
                timestamp: Date.now(),
                text: 'Error' + i,
            });
        }

        fixture.componentRef.setInput('collection', collection);
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

    it('provides a collection with all messages (5 errors, 5 warnings, 5 info)', () => {
        expect(component.collection().length).toEqual(3 * sizePerType);
    });

    it('shows initial only errors', () => {
        expect(component.showError()).toBeTrue();
        expect(component.showInfo()).toBeFalse();
        expect(component.showWarning()).toBeFalse();
    });

    it('supports 3 sortable headers', () => {
        expect(component.headers()?.length).toEqual(3);
    });

    describe('show only errors', () => {
        beforeEach(() => {
            component.showInfo.set(false);
            component.showWarning.set(false);
            component.showError.set(true);
            fixture.detectChanges();
        });

        it('shows only errors', () => {
            expect(component.messages().length).toEqual(sizePerType);
            expect(component.messages().every(message => message.type === 'Error')).toBeTrue();
        });

        it('hides the pagination', () => {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeNull();
        });
    });

    describe('show only warnings', () => {
        beforeEach(() => {
            component.showInfo.set(false);
            component.showWarning.set(true);
            component.showError.set(false);
            fixture.detectChanges();
        });

        it('shows only warnings', () => {
            expect(component.size()).toEqual(sizePerType);
            expect(component.messages().every(message => message.type === 'Warning')).toBeTrue();
        });

        it('hides the pagination', () => {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeNull();
        });
    });

    describe('show only info', () => {
        beforeEach(() => {
            component.showInfo.set(true);
            component.showWarning.set(false);
            component.showError.set(false);
            fixture.detectChanges();
        });

        it('shows only info', () => {
            expect(component.size()).toEqual(sizePerType);
            expect(component.messages().every(message => message.type === 'Info')).toBeTrue();
        });

        it('hides the pagination', () => {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeNull();
        });
    });

    describe('show all messages', () => {
        beforeEach(() => {
            component.showInfo.set(true);
            component.showWarning.set(true);
            component.showError.set(true);
            fixture.detectChanges();
        });

        it('shows all messages first page of two', () => {
            expect(component.size()).toEqual(collection.length);
        });

        it('shows the pagination', () => {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeDefined();
        });

        it('provides 2 pages (10, 5)', () => {
            expect(component.page()).toEqual(1);
            expect(component.messages()).toEqual(component.collection().slice(0, 10));

            component.page.set(2);
            fixture.detectChanges();
            expect(component.messages()).toEqual(component.collection().slice(-5));
        });
    });

    describe('sorting', () => {
        beforeEach(() => {
            component.showInfo.set(true);
            component.showWarning.set(true);
            component.showError.set(true);
            fixture.componentRef.setInput('pageSize', collection.length);
            fixture.detectChanges();
        });

        it('shows the origin order', () => {
            component.onSort({ column: '', direction: '' });
            fixture.detectChanges();
            expect(component.messages()).toEqual(collection);
        });
    });
});
