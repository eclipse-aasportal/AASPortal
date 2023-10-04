/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { Logger } from './logging/logger.js';
import { AASDocument, aas, isDeepEqual } from 'common';
import { ScanContainerData } from './aas-provider/worker-data.js';
import { AasxDirectory } from './packages/aasx-directory/aasx-directory.js';
import { AASResource } from './packages/aas-resource.js';
import { AasxServer } from './packages/aasx-server/aasx-server.js';
import { OpcuaServer } from './packages/opcua/opcua-server.js';
import { ScanContainerResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { UpdateStatistic } from './update-statistic.js';
import { AASResourceScanFactory } from './aas-provider/aas-resource-scan-factory.js';
import { Container } from './aas-provider/container.js';
import { Variable } from './variable.js';

@singleton()
export class ScanContainer {
    private data!: ScanContainerData;
    private reference!: Map<string, AASDocument>;
    private source!: AASResource;

    constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(UpdateStatistic) private readonly statistic: UpdateStatistic,
        @inject(AASResourceScanFactory) private readonly resourceScanFactory: AASResourceScanFactory,
        @inject(Variable) private readonly variable: Variable
    ) {
    }

    public async scanAsync(data: ScanContainerData): Promise<void> {
        this.data = data;
        this.reference = new Map<string, AASDocument>(data.container.documents!.map(item => [item.id, item]));
        const container = new Container()

        let documents: AASDocument[];
        const scan = this.resourceScanFactory.create(data.container.url);
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

    private computeDeleted(documents: AASDocument[]) {
        const current = new Map<string, AASDocument>(documents.map(item => [item.id, item]));
        for (const referenceDocument of this.reference.values()) {
            if (!current.has(referenceDocument.id)) {
                this.postDeleted(referenceDocument);
            }
        }
    }

    private onDocumentScanned = (document: AASDocument): void => {
        const referenceDocument = this.reference.get(document.id);
        if (referenceDocument) {
            if (this.documentChanged(document, referenceDocument)) {
                this.postChanged(document);
            }
        } else {
            this.postAdded(document);
        }
    }

    private onError = (error: Error, source: AASResource, arg: string): void => {
        this.logger.error(error);
        if (source instanceof AasxDirectory) {
            const file = arg as string;
            for (const referenceDocument of this.reference.values()) {
                if (referenceDocument.container === source.url.href && referenceDocument.endpoint.address === file) {
                    this.postOffline(referenceDocument);
                    break;
                }
            }
        } else if (source instanceof AasxServer) {
            const idShort = arg;
            for (const referenceDocument of this.reference.values()) {
                if (referenceDocument.container === source.url.href && referenceDocument.idShort === idShort) {
                    this.postOffline(referenceDocument);
                    break;
                }
            }
        } else if (source instanceof OpcuaServer) {
            const nodeId = arg as string;
            for (const referenceDocument of this.reference.values()) {
                if (referenceDocument.container === source.url.href && referenceDocument.endpoint.address === nodeId) {
                    this.postOffline(referenceDocument);
                    break;
                }
            }
        }
    }

    private postChanged(document: AASDocument): void {
        const value: ScanContainerResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Changed,
            container: this.data.container,
            document: document,
            statistic: this.statistic.update(this.data.statistic, ScanResultType.Changed)
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
            statistic: this.statistic.update(this.data.statistic, ScanResultType.Removed)
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
            statistic: this.statistic.update(this.data.statistic, ScanResultType.Added)
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private postOffline(document: AASDocument): void {
        const value: ScanContainerResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Offline,
            container: this.data.container,
            document: { ...document, content: undefined },
            statistic: this.statistic.update(this.data.statistic, ScanResultType.Offline)
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private documentChanged(document: AASDocument, reference: AASDocument): boolean {
        let changed: boolean;
        if (document.content === reference.content) {
            changed = false;
        } else if (document.content && reference.content) {
            changed = !this.equalContent(document.content, reference.content);
        } else {
            changed = true;
        }

        return changed;
    }

    private equalContent(
        a: aas.Environment | null,
        b: aas.Environment | null): boolean {
        let equals: boolean;
        if (a === b) {
            equals = true;
        } else if (a !== null && b !== null) {
            equals = isDeepEqual(a, b);
        } else {
            equals = false;
        }

        return equals;
    }
}