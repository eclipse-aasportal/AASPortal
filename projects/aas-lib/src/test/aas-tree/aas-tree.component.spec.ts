/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASDocument, WebSocketData } from 'aas-core';
import { Subject } from 'rxjs';

import { AASTreeComponent } from '../../lib/aas-tree/aas-tree.component';
import { sampleDocument } from '../assets/sample-document';
import { NotifyService } from '../../lib/notify/notify.service';
import { WebSocketFactoryService } from '../../lib/web-socket-factory.service';
import { TestWebSocketFactoryService } from '../assets/test-web-socket-factory.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthService } from '../../lib/auth/auth.service';
import { WINDOW } from '../../public-api';

describe('AASTreeComponent', () => {
    let component: AASTreeComponent;
    let fixture: ComponentFixture<AASTreeComponent>;
    let document: AASDocument;
    let webSocketSubject: Subject<WebSocketData>;

    beforeEach(() => {
        document = sampleDocument;
        webSocketSubject = new Subject<WebSocketData>();

        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
                {
                    provide: AuthService,
                    useValue: jasmine.createSpyObj<AuthService>({}, { token: signal('Token') }),
                },
                {
                    provide: WINDOW,
                    useValue: jasmine.createSpyObj<Window>(['addEventListener', 'open', 'removeEventListener']),
                },
                {
                    provide: WebSocketFactoryService,
                    useValue: new TestWebSocketFactoryService(webSocketSubject),
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

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

    it('indicates if document is online-ready', () => {
        expect(component.onlineReady()).toEqual(document.onlineReady ? document.onlineReady : false);
    });

    it('indicates if document is read-only', () => {
        expect(component.readonly()).toEqual(document.readonly);
    });

    it('indicates if the document is modified', () => {
        expect(component.modified()).toEqual(document.modified ? document.modified : false);
    });

    it('shows the current offline state', () => {
        expect(component.state()).toEqual('offline');
    });

    it('indicates if no node is selected', () => {
        expect(component.someSelected()).toBeFalse();
    });

    it('shows the first level ExampleMotor', () => {
        const nodes = component.nodes();
        expect(nodes).toBeTruthy();
        expect(nodes.length).toEqual(5);
        expect(nodes[0].element.idShort).toEqual('ExampleMotor');
        expect(nodes[0].expanded).toBeTrue();
        expect(nodes[1].element.idShort).toEqual('Identification');
        expect(nodes[2].element.idShort).toEqual('TechnicalData');
        expect(nodes[3].element.idShort).toEqual('OperationalData');
        expect(nodes[4].element.idShort).toEqual('Documentation');
    });

    describe('toggleSelection', () => {
        it('toggle selection of all rows', () => {
            component.toggleSelections();
            expect(component.rows().every(value => value.selected)).toBeTrue();
        });
    });

    describe('collapse', () => {
        it('collapse root element', () => {
            component.collapse(component.nodes()[0]);
            expect(component.nodes().length).toEqual(1);
            expect(component.nodes()[0].element.idShort).toEqual('ExampleMotor');
            expect(component.nodes()[0].expanded).toBeFalse();
        });

        it('collapse to initial view', () => {
            component.collapse();
            expect(component.nodes().length).toEqual(5);
            expect(component.nodes()[0].element.idShort).toEqual('ExampleMotor');
            expect(component.nodes()[0].expanded).toBeTrue();
            expect(component.nodes()[1].element.idShort).toEqual('Identification');
            expect(component.nodes()[2].element.idShort).toEqual('TechnicalData');
            expect(component.nodes()[3].element.idShort).toEqual('OperationalData');
            expect(component.nodes()[4].element.idShort).toEqual('Documentation');
        });
    });

    describe('expand', () => {
        it('expand submodel "Identification"', () => {
            component.expand(component.nodes()[1]);
            expect(component.nodes().length).toEqual(9);
            expect(component.nodes()[1].element.idShort).toEqual('Identification');
            expect(component.nodes()[0].expanded).toBeTrue();
        });

        it('expands all', () => {
            expect(component.expanded()).toEqual(false);
            component.expand();
            expect(component.nodes()).toEqual(component.rows());
            expect(component.expanded()).toEqual(true);
        });
    });

    describe('search text "max"', () => {
        it('the search text must be at least three characters long', () => {
            fixture.componentRef.setInput('searchExpression', 'z');
            fixture.detectChanges();
            fixture.componentRef.setInput('searchExpression', 'zy');
            fixture.detectChanges();
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            expect(component.matchRow()?.name).toEqual('MaxRotationSpeed');
        });

        it('finds the first occurrence of "max" at row 7', () => {
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            expect(component.matchIndex()).toEqual(7);
        });

        it('finds the next occurrence of "max" at row 8', () => {
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            component.findNext();
            expect(component.matchIndex()).toEqual(8);
        });

        it('finds the previous occurrence of "max" at row 25', () => {
            fixture.componentRef.setInput('searchExpression', 'max');
            fixture.detectChanges();
            component.findPrevious();
            expect(component.matchIndex()).toEqual(8);
        });
    });

    describe('search pattern', () => {
        it('finds the first occurrence of "#prop:max" at row 7', () => {
            fixture.componentRef.setInput('searchExpression', '#prop:max');
            fixture.detectChanges();
            expect(component.matchIndex()).toEqual(7);
        });

        it('finds the first occurrence of "#prop:MaxTorque" at row 8', () => {
            fixture.componentRef.setInput('searchExpression', '#prop:MaxTorque');
            fixture.detectChanges();
            expect(component.matchIndex()).toEqual(8);
        });

        it('finds the first occurrence of "#prop:serialnumber=P12345678I40" at row 5', () => {
            fixture.componentRef.setInput('searchExpression', '#prop:serialnumber=P12345678I40');
            fixture.detectChanges();
            expect(component.matchIndex()).toEqual(5);
        });
    });
});
