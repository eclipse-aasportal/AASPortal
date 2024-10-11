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
import { ScanContainerData } from './aas-provider/worker-data.js';
import { ScanContainerResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { AASResourceScanFactory } from './aas-provider/aas-resource-scan-factory.js';
import { Variable } from './variable.js';

@singleton()
export class ScanContainer {
    private data!: ScanContainerData;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(AASResourceScanFactory) private readonly resourceScanFactory: AASResourceScanFactory,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public async scanAsync(data: ScanContainerData): Promise<void> {
        this.data = data;
        let documents: AASDocument[];
        const scan = this.resourceScanFactory.create(data.container);
        try {
            scan.on('scanned', this.onDocumentScanned);
            scan.on('error', this.onError);
            documents = await scan.scanAsync();
            this.computeDeleted(documents);
        } finally {
            scan.off('scanned', this.onDocumentScanned);
            scan.off('error', this.onError);
        }
    }

    private computeDeleted(documents: AASDocument[]): void {
        if (!this.data.container.documents) return;

        const current = new Map<string, AASDocument>(documents.map(item => [item.id, item]));
        for (const document of this.data.container.documents) {
            if (!current.has(document.id)) {
                this.postDeleted(document);
            }
        }
    }

    private onDocumentScanned = (document: AASDocument): void => {
        const reference = this.data.container.documents?.find(item => item.id === document.id);
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
        const value: ScanContainerResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Changed,
            container: this.data.container,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private postDeleted(document: AASDocument): void {
        const value: ScanContainerResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Removed,
            container: this.data.container,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private postAdded(document: AASDocument): void {
        const value: ScanContainerResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Added,
            container: this.data.container,
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

    // private equalContent(a: aas.Environment | null, b: aas.Environment | null): boolean {
    //     let equals: boolean;
    //     if (a === b) {
    //         equals = true;
    //     } else if (a !== null && b !== null) {
    //         equals = isDeepEqual(a, b);
    //     } else {
    //         equals = false;
    //     }

    //     return equals;
    // }
}
