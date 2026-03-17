/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AASDocument, WebSocketData } from 'aas-core';

import { AASTreeComponent } from '../../../lib/components/aas-tree/aas-tree.component';
import { sampleDocument } from '../../assets/sample-document';
import { NotifyService } from '../../../lib/components/notify/notify.service';
import { WebSocketService } from '../../../lib/services/web-socket.service';
import { WINDOW } from '../../../lib/services/window.service';
import { AASTreeApi } from '../../../lib/components/aas-tree/aas-tree-api';
import { createSpyObj, FakeLoader, MockWebSocketService } from '../../mocks';
import { VIEW_ROUTES } from '../../../lib/views/views-routes';

describe('AASTreeComponent', () => {
    let fixture: ComponentFixture<AASTreeComponent>;
    let component: AASTreeComponent;
    let document: AASDocument;
    let webSocketSubject: Subject<WebSocketData>;
    let api: Mocked<AASTreeApi>;

    beforeEach(async () => {
        document = sampleDocument;
        webSocketSubject = new Subject<WebSocketData>();
        api = createSpyObj<AASTreeApi>(['getValueAsync']);

        await TestBed.configureTestingModule({
            imports: [AASTreeComponent],
            providers: [
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
                {
                    provide: WINDOW,
                    useValue: createSpyObj<Window>(['addEventListener', 'open', 'removeEventListener']),
                },
                {
                    provide: WebSocketService,
                    useValue: new MockWebSocketService(),
                },
                {
                    provide: AASTreeApi,
                    useValue: api,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {} as Partial<ActivatedRoute>,
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: [],
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AASTreeComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
    });

    afterEach(() => {
        webSocketSubject?.unsubscribe();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('gets the current document', () => {
        expect(component.document()).toEqual(document);
    });

    it('shows the current live state', () => {
        expect(component.live()).toEqual('offline');
    });

    it('indicates if no node is selected', () => {
        expect(component.someSelected()).toBe(false);
    });

    it('shows the first level ExampleMotor', () => {
        const nodes = component.nodes();
        expect(nodes).toBeTruthy();
        expect(nodes.length).toEqual(5);
        expect(nodes[0].name).toEqual('ExampleMotor');
        expect(component.isExpanded(nodes[0])).toBe(true);
        expect(nodes[1].name).toEqual('Identification');
        expect(nodes[2].name).toEqual('TechnicalData');
        expect(nodes[3].name).toEqual('OperationalData');
        expect(nodes[4].name).toEqual('Documentation');
    });

    describe('toggleSelection', () => {
        it('toggle selection of all rows', () => {
            component.toggleSelection();
            expect(component.nodes().every(value => value.selected)).toBe(true);
        });
    });

    describe('collapse', () => {
        it('collapse root element', () => {
            component.collapse(component.nodes()[0]);
            expect(component.nodes().length).toEqual(1);
            expect(component.nodes()[0].id.idShort).toEqual('ExampleMotor');
            expect(component.isExpanded(component.nodes()[0])).toBe(false);
        });

        it('collapse to initial view', () => {
            component.collapse();
            expect(component.nodes().length).toEqual(1);
            expect(component.nodes()[0].id.idShort).toEqual('ExampleMotor');
            expect(component.isExpanded(component.nodes()[0])).toBe(false);
        });
    });

    describe('expand', () => {
        it('expand submodel "Identification"', () => {
            component.expand(component.nodes()[1]);
            expect(component.nodes().length).toEqual(9);
            expect(component.nodes()[1].id.idShort).toEqual('Identification');
            expect(component.isExpanded(component.nodes()[0])).toBe(true);
        });

        it('expands all', () => {
            expect(component.expanded()).toEqual(false);
            component.expand();
            expect(component.nodes()).toEqual(component.nodes());
            expect(component.expanded()).toEqual(true);
        });
    });

    describe('search text "max"', () => {
        it('the search text must be at least three characters long', () => {
            fixture.componentRef.setInput('searchExpression', 'm');
            fixture.detectChanges();
            fixture.componentRef.setInput('searchExpression', 'ma');
            fixture.detectChanges();
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxRotationSpeed');
        });

        it('finds the next occurrences of "max"', () => {
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxRotationSpeed');
            component.findNext();
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxTorque');
            component.findNext();
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxRotationSpeed');
        });

        it('finds the previous occurrences of "max"', () => {
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxRotationSpeed');
            component.findPrevious();
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxTorque');
            component.findPrevious();
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxRotationSpeed');
        });
    });

    describe('search pattern', () => {
        it('finds the first occurrence of "#prop:max" at row 7', () => {
            fixture.componentRef.setInput('searchExpression', '#prop:max');
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxRotationSpeed');
        });

        it('finds the first occurrence of "#prop:MaxTorque" at row 8', () => {
            fixture.componentRef.setInput('searchExpression', '#prop:MaxTorque');
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('MaxTorque');
        });

        it('finds the first occurrence of "#prop:serialnumber=P12345678I40" at row 5', () => {
            fixture.componentRef.setInput('searchExpression', '#prop:serialnumber=P12345678I40');
            fixture.detectChanges();
            expect(component.highlighted()?.name).toEqual('SerialNumber');
        });
    });
});
