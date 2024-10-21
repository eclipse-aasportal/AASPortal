/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { Logger } from './logging/logger.js';
import { AASDocument } from 'aas-core';
import { ScanEndpointData } from './aas-provider/worker-data.js';
import { ScanEndpointResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { AASResourceScanFactory } from './aas-provider/aas-resource-scan-factory.js';
import { Variable } from './variable.js';

@singleton()
export class EndpointScan {
    private data!: ScanEndpointData;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(AASResourceScanFactory) private readonly resourceScanFactory: AASResourceScanFactory,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public async scanAsync(data: ScanEndpointData): Promise<string | undefined> {
        this.data = data;
        const scan = this.resourceScanFactory.create(data.endpoint);
        try {
            scan.on('scanned', this.onDocumentScanned);
            scan.on('error', this.onError);
            const result = await scan.scanAsync(data.cursor);
            this.computeDeleted(result.result);
            return result.paging_metadata.cursor;
        } finally {
            scan.off('scanned', this.onDocumentScanned);
            scan.off('error', this.onError);
        }
    }

    private computeDeleted(documents: AASDocument[]): void {
        if (this.data.documents === undefined) {
            return;
        }

        const current = new Map<string, AASDocument>(documents.map(item => [item.id, item]));
        for (const document of this.data.documents) {
            if (!current.has(document.id)) {
                this.postDeleted(document);
            }
        }
    }

    private onDocumentScanned = (document: AASDocument): void => {
        const reference = this.data.documents?.find(item => item.id === document.id);
        if (reference) {
            if (this.documentChanged(document, reference)) {
                this.postChanged(document);
            }
        } else {
            this.postAdded(document);
        }
    };

    private onError = (error: Error): void => {
        this.logger.error(error);
    };

    private postChanged(document: AASDocument): void {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Changed,
            endpoint: this.data.endpoint,
            documents: this.data.documents,
            cursor: this.data.cursor,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private postDeleted(document: AASDocument): void {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Removed,
            endpoint: this.data.endpoint,
            documents: this.data.documents,
            cursor: this.data.cursor,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private postAdded(document: AASDocument): void {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Added,
            endpoint: this.data.endpoint,
            documents: this.data.documents,
            cursor: this.data.cursor,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private documentChanged(document: AASDocument, reference: AASDocument): boolean {
        if (
            document.crc32 === reference.crc32 &&
            (!reference.timestamp || Date.now() - reference.timestamp <= this.variable.AAS_EXPIRES_IN)
        ) {
            return false;
        }

        return true;
    }
}
