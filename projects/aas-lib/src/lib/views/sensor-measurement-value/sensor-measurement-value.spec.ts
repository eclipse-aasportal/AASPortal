/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { aas, AASDocument, WebSocketData } from 'aas-core';

import { WebSocketService } from '../../services/web-socket.service';
import { FakeLoader } from '../../../test/mocks';
import { SensorMeasurementValue } from './sensor-measurement-value';
import { validateSensorMeasurementValue } from './sensor-measurement-value-validator';

import measurementValue from '../../../test/assets/sensor-measurement-value-1-0.json';

describe('SensorMeasurementValue', () => {
    let component: SensorMeasurementValue;
    let fixture: ComponentFixture<SensorMeasurementValue>;
    let messages: Subject<WebSocketData>;
    let webSocket: Pick<WebSocketService, 'getMessages' | 'sendMessage'>;
    let document: AASDocument;
    let environment: aas.Environment;
    let submodel: aas.Submodel;

    beforeEach(async () => {
        messages = new Subject<WebSocketData>();
        webSocket = { getMessages: () => messages, sendMessage: vi.fn() };
        environment = measurementValue as aas.Environment;
        submodel = environment.submodels[0];
        document = {
            address: '',
            crc32: 0,
            endpoint: 'Test',
            id: 'https://example.com/aas/sensor',
            idShort: 'SensorAAS',
            readonly: false,
            timestamp: 0,
            content: environment,
        };

        await TestBed.configureTestingModule({
            imports: [SensorMeasurementValue],
            providers: [
                { provide: WebSocketService, useValue: webSocket },
                provideTranslateService({ loader: { provide: TranslateLoader, useClass: FakeLoader } }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SensorMeasurementValue);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('document', document);
        fixture.componentRef.setInput('submodel', submodel);
        fixture.detectChanges();
    });

    it('validates and renders the required measurement, optional metadata, and vendor extension', () => {
        expect(component.validation().valid).toBe(true);
        expect(component.data()).toMatchObject({
            value: '23.5',
            unit: '°C',
            kind: 'Temperature',
            timestamp: '2025-12-11T10:15:00Z',
            range: '0 – 100',
            quality: 'good',
            identifier: '0173-1#02-BAF016#001',
        });
        expect(component.data()?.extensions.map(item => item.idShort)).toEqual(['VendorExtension']);
    });

    it('rejects missing required fields, wrong types, duplicate fields, and semantic IDs', () => {
        const cases: Array<(submodel: aas.Submodel) => void> = [
            submodel => submodel.submodelElements?.splice(0, 1),
            submodel => {
                const timestamp = submodel.submodelElements?.find(
                    item => item.idShort === 'MeasurementTimestamp',
                ) as aas.Property;
                timestamp.valueType = 'xs:string';
            },
            submodel => submodel.submodelElements?.push(structuredClone(submodel.submodelElements[0])),
            submodel => {
                const qualifier = submodel.submodelElements?.find(item => item.idShort === 'MeasurementQualifier')!;
                qualifier.semanticId!.keys[0].value = 'https://example.com/wrong';
            },
        ];
        for (const mutate of cases) {
            const invalidSubmodel = structuredClone(submodel) as aas.Submodel;
            mutate(invalidSubmodel);
            expect(validateSensorMeasurementValue(invalidSubmodel).valid).toBe(false);
        }
    });

    it('allows omitted optional structures', () => {
        const optionalSubmodel = structuredClone(submodel) as aas.Submodel;
        optionalSubmodel.submodelElements = optionalSubmodel.submodelElements?.filter(
            item => !['MeasuredValuePreDefined', 'Concept'].includes(item.idShort),
        );
        const qualifier = optionalSubmodel.submodelElements?.find(
            item => item.idShort === 'MeasurementQualifier',
        ) as aas.SubmodelElementCollection;
        qualifier.value = qualifier.value?.filter(item => !['Range', 'Scale', 'Tag'].includes(item.idShort));
        expect(validateSensorMeasurementValue(optionalSubmodel).valid).toBe(true);
    });

    it('rejects an optional collection when its required child is missing', () => {
        const invalidSubmodel = structuredClone(submodel) as aas.Submodel;
        const predefined = invalidSubmodel.submodelElements?.find(
            item => item.idShort === 'MeasuredValuePreDefined',
        ) as aas.SubmodelElementCollection;
        predefined.value = [];
        expect(validateSensorMeasurementValue(invalidSubmodel).valid).toBe(false);
    });

    it('requests and applies live updates for MeasuredValue.Value', () => {
        expect(webSocket.sendMessage).toHaveBeenCalledWith({
            type: 'LiveRequest',
            data: {
                endpoint: document.endpoint,
                id: document.id,
                nodes: [{ nodeId: 'ns=2;s=Temperature', valueType: 'xs:float' }],
            },
        });

        messages.next({
            type: 'LiveNode[]',
            data: [{ nodeId: 'ns=2;s=Temperature', value: 24.2, valueType: 'xs:float', timeStamp: 0 }],
        });
        expect(component.data()?.value).toBe('24.2');
        expect(component.data()?.timestamp).not.toBe('2025-12-11T10:15:00Z');
    });

    it('does not subscribe when the primary value has no node ID', () => {
        const noLiveSubmodel = structuredClone(submodel) as aas.Submodel;
        const measuredValue = noLiveSubmodel.submodelElements?.find(
            item => item.idShort === 'MeasuredValue',
        ) as aas.SubmodelElementCollection | undefined;
        measuredValue?.value?.forEach(item => {
            if (item.idShort === 'Value') {
                delete (item as aas.Property).nodeId;
            }
        });

        fixture.componentRef.setInput('submodel', noLiveSubmodel);
        fixture.detectChanges();
        expect(component.isLive()).toBe(false);
        expect(messages.observed).toBe(false);
    });

    it('does not render a partial measurement for an invalid template', () => {
        const invalidSubmodel = structuredClone(submodel) as aas.Submodel;
        invalidSubmodel.submodelElements = invalidSubmodel.submodelElements?.filter(
            item => item.idShort !== 'MeasuredValue',
        );
        fixture.componentRef.setInput('submodel', invalidSubmodel);
        fixture.detectChanges();
        expect(component.data()).toBeUndefined();
        expect(component.errors()).not.toHaveLength(0);
        expect(fixture.nativeElement.textContent).toContain('SensorMeasurementValue.INVALID_TEMPLATE');
    });

    it('unsubscribes from live updates when destroyed', () => {
        expect(messages.observed).toBe(true);
        fixture.destroy();
        expect(messages.observed).toBe(false);
    });
});
