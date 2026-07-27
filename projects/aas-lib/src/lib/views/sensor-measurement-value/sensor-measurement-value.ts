/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { aas, AASDocument, convertToString, LiveNode, LiveRequest, WebSocketData } from 'aas-core';

import { WebSocketService } from '../../services/web-socket.service';
import { MeasurementValueData, validateSensorMeasurementValue } from './sensor-measurement-value-validator';

@Component({
    selector: 'fhg-sensor-measurement-value',
    templateUrl: './sensor-measurement-value.html',
    styleUrl: './sensor-measurement-value.scss',
    imports: [TranslateDirective, TranslatePipe],
})
export class SensorMeasurementValue implements OnDestroy {
    private readonly webSocket = inject(WebSocketService);
    private readonly translate = inject(TranslateService);
    private webSocketSubscription?: Subscription;
    private readonly liveValue = signal<string | undefined>(undefined);
    private readonly liveTimestamp = signal<string | undefined>(undefined);

    public readonly document = input<AASDocument>();
    public readonly submodel = input<aas.Submodel>();
    public readonly validation = computed(() => validateSensorMeasurementValue(this.submodel()));
    public readonly data = computed<MeasurementValueData | undefined>(() => {
        const validation = this.validation();
        if (!validation.valid) {
            return undefined;
        }

        return {
            ...validation.data,
            value: this.liveValue() ?? validation.data.value,
            timestamp: this.liveTimestamp() ?? validation.data.timestamp,
        };
    });
    public readonly errors = computed(() => {
        const validation = this.validation();
        return validation.valid ? [] : validation.errors;
    });
    public readonly isLive = computed(() => Boolean(this.data()?.valueProperty.nodeId));

    public constructor() {
        effect(() => {
            const document = this.document();
            const validation = this.validation();
            this.stop();
            this.liveValue.set(undefined);
            this.liveTimestamp.set(undefined);
            if (document && validation.valid) {
                const value = validation.data.valueProperty;
                const nodeId = value.nodeId;
                if (!nodeId) {
                    return;
                }

                this.webSocketSubscription = this.webSocket.getMessages().subscribe({ next: this.onMessage });
                this.webSocket.sendMessage({
                    type: 'LiveRequest',
                    data: {
                        endpoint: document.endpoint,
                        id: document.id,
                        nodes: [{ nodeId, valueType: value.valueType ?? 'undefined' }],
                    } satisfies LiveRequest,
                });
            }
        });
    }

    public ngOnDestroy(): void {
        this.stop();
    }

    private readonly onMessage = (message: WebSocketData): void => {
        if (message.type !== 'LiveNode[]') {
            return;
        }

        const nodeId = this.data()?.valueProperty.nodeId;
        const liveNode = (message.data as LiveNode[]).find(item => item.nodeId === nodeId);
        if (liveNode) {
            const locale = this.translate.currentLang() ?? 'en-us';
            this.liveValue.set(convertToString(liveNode.value, locale));
            if (liveNode.timeStamp !== undefined) {
                this.liveTimestamp.set(convertToString(new Date(liveNode.timeStamp), locale));
            }
        }
    };

    private stop(): void {
        this.webSocketSubscription?.unsubscribe();
        this.webSocketSubscription = undefined;
    }
}
