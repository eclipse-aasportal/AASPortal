/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'events';
import { nanoid } from 'nanoid';
import { rmSync } from 'node:fs';
import path from 'path/posix';
import { container } from 'tsyringe';
import { aas, AASDocument, AASEndpoint, convertToString, PagedResult } from 'aas-core';
import { AASIndex } from '../index/aas-index.js';
import { ScannerController } from './scanner-controller.js';
import { Variable } from '../variable.js';
import { EndpointScanDatabase } from './endpoint-scan-database.js';

/**
 * Defines an automate to scan an AAS endpoint for new, deleted or updated Asset Administration Shells.
 */
export abstract class EndpointScanner extends EventEmitter {
    private readonly variable = container.resolve(Variable);
    private readonly scanDbFile = path.join(this.variable.CONTENT_ROOT, `endpoint-scan-${nanoid()}.db`);
    private readonly scanDb: EndpointScanDatabase;
    private readonly now = Date.now();
    private shellCount = 0;
    private submodelCount = 0;
    private done = 0;
    private progress = 0;

    protected constructor(protected readonly controller: ScannerController) {
        super();

        this.scanDb = new EndpointScanDatabase(this.scanDbFile);
    }

    /**
     * Gets all documents of the current endpoint.
     * @param index The AAS index.
     * @param endpoint The endpoint.
     */
    public async scan(index: AASIndex, endpoint: AASEndpoint): Promise<void> {
        this.scanDb.clear();
        this.shellCount = this.submodelCount = 0;
        this.done = 0;
        this.progress = -1;

        try {
            await this.open();
            await this.scanForNewAndUpdatedShells(index, endpoint.name);
            await Promise.all([
                this.scanForDeletedShellsAndUpdateThumbnail(index, endpoint.name),
                this.createIndex(index, endpoint.name),
            ]);
        } catch (error) {
            this.emit('error', `Scanning endpoint "${endpoint.name}" failed: ${convertToString(error)}`);
        } finally {
            try {
                await this.close();
            } finally {
                this.scanDb.close();
            }
        }
    }

    public destroy(): void {
        this.scanDb.close();
        rmSync(this.scanDbFile, { force: true });
    }

    /**
     * Opens the endpoint and prepares it for scanning.
     */
    protected abstract open(): Promise<void>;

    /**
     * Closes the endpoint and releases all resources.
     */
    protected abstract close(): Promise<void>;

    /**
     * Gets a page of documents from the endpoint.
     * @param cursor The cursor to get the next page of documents. If undefined, the first page will be returned.
     */
    protected abstract getDocuments(cursor: string | undefined): Promise<PagedResult<AASDocument>>;

    /**
     * Determines whether the document with the specified address exists in the endpoint.
     * @param address The address of the document in the endpoint.
     * @returns True if the document exists, false otherwise.
     */
    protected abstract hasDocument(address: string): Promise<boolean>;

    /**
     * Gets the thumbnail of the document with the specified address from the endpoint.
     * @param address The address of the document in the endpoint.
     * @returns The thumbnail of the document or undefined if the document has no thumbnail.
     */
    protected abstract getThumbnail(address: string): Promise<string | undefined>;

    /**
     * Gets a page of submodels from the endpoint.
     * @param cursor The cursor to get the next page of submodels. If undefined, the first page will be returned.
     */
    protected abstract getSubmodels(cursor: string | undefined): Promise<PagedResult<aas.Submodel>>;

    private registerSubmodels(submodelRefs: aas.Reference[], b: AASDocument): void {
        this.scanDb.registerSubmodels(submodelRefs, b.id);
    }

    private async scanForNewAndUpdatedShells(index: AASIndex, endpoint: string): Promise<void> {
        let cursor: string | undefined;
        do {
            const result = await this.getDocuments(cursor);
            for (const b of result.result) {
                if (this.controller.cancelRequested) {
                    break;
                }

                const a = await index.find(endpoint, 'AssetAdministrationShell', b.id);
                if (a === undefined) {
                    this.scanDb.setShellChanged(b.id, true);
                    await index.insert(b);
                    this.emit('add', b);
                } else {
                    if (a.idShort !== b.idShort || a.assetId !== b.assetId) {
                        await index.update({ ...b, thumbnail: a.thumbnail });
                        this.emit('update', b);
                    }

                    if (this.now - b.timestamp > this.variable.AAS_EXPIRES_IN) {
                        await index.clear(endpoint, b.id);
                        this.scanDb.setShellChanged(b.id, true);
                    } else {
                        this.scanDb.setShellChanged(b.id, false);
                    }
                }

                const shell = b.content?.assetAdministrationShells?.at(0);
                if (!shell || !shell.submodels) {
                    continue;
                }

                this.registerSubmodels(shell.submodels, b);
                this.submodelCount += shell.submodels.length;
                ++this.shellCount;
            }

            cursor = result.paging_metadata.cursor;
        } while (cursor && !this.controller.cancelRequested);
    }

    private async scanForDeletedShellsAndUpdateThumbnail(index: AASIndex, endpoint: string): Promise<void> {
        let cursor: string | undefined;
        do {
            const result = await index.getEndpointDocuments(endpoint, cursor);
            for (const document of result.result) {
                if (this.controller.cancelRequested) {
                    return;
                }

                this.computeProgress();

                if (!this.scanDb.hasShell(document.id) && !(await this.hasDocument(document.address))) {
                    await index.delete(endpoint, document.id);
                    this.emit('remove', document);
                } else {
                    const expired = this.now - document.timestamp > this.variable.AAS_EXPIRES_IN;
                    if (!document.thumbnail || expired) {
                        const thumbnail = await this.getThumbnail(document.address);
                        if (thumbnail) {
                            await index.update({ ...document, thumbnail, timestamp: this.now });
                            this.emit('update', document);
                        }
                    }
                }

                ++this.done;
            }

            cursor = result.paging_metadata.cursor;
        } while (cursor && !this.controller.cancelRequested);
    }

    private async createIndex(index: AASIndex, endpoint: string): Promise<void> {
        let cursor: string | undefined;
        do {
            const result = await this.getSubmodels(cursor);
            for (const submodel of result.result) {
                if (this.controller.cancelRequested) {
                    return;
                }

                this.computeProgress();

                const shellIds = this.scanDb.getShellIds(submodel.id);
                if (shellIds.length === 0) {
                    continue;
                }

                for (const shellId of shellIds) {
                    if (this.controller.cancelRequested) {
                        return;
                    }

                    if (this.scanDb.isShellChanged(shellId)) {
                        await index.create(endpoint, shellId, { submodels: [submodel] });
                    }
                }

                ++this.done;
            }

            cursor = result.paging_metadata.cursor;
        } while (cursor && !this.controller.cancelRequested);
    }

    private computeProgress(): void {
        const value = Math.min(Math.trunc((this.done / (this.shellCount + this.submodelCount)) * 100), 100);
        if (value !== this.progress) {
            this.progress = value;
            this.emit('progress', this.progress, this.shellCount, this.submodelCount);
        }
    }
}
