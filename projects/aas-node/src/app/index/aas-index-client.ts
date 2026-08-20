/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import path from 'path';
import { isMainThread, MessagePort, MessageChannel, parentPort, SHARE_ENV, Worker } from 'worker_threads';
import { aas, AASEndpoint, AASCursor, AASPagedResult, PagedResult, AASDocument } from 'aas-core';
import { IAASIndex, ChannelCommand, CommandName, ChannelResponse, isChannelError, ChannelError } from './aas-index.js';

import { Variable } from '../variable.js';
import { CommandData, isCommandData, isResponseData, WorkerData } from '../types.js';

type ResolvePending = {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    handle: NodeJS.Timeout;
};

/**
 * Represents a client for the AAS index worker thread.
 */
@singleton()
export class AASIndexClient implements IAASIndex {
    private readonly variable = container.resolve(Variable);
    private readonly worker?: Worker;
    private readonly pending = new Map<number, ResolvePending>();
    private port!: MessagePort;
    private id = 0;

    public constructor() {
        if (isMainThread) {
            const { port1, port2 } = new MessageChannel();
            this.port = port2;
            const script = path.resolve(this.variable.CONTENT_ROOT, 'aas-idx.js');
            const workerName = 'AASNode Worker';
            this.worker = new Worker(script, { env: SHARE_ENV, name: workerName });
            this.worker.on('error', this.onWorkerError);
            this.worker.on('message', this.onWorkerMessage);
            this.worker.postMessage(
                {
                    application: 'IndexApp',
                    type: 'command',
                    name: 'connect',
                    args: { port: port1, name: workerName },
                } satisfies CommandData,
                [port1],
            );

            this.port.on('message', this.onMessage);
        } else {
            parentPort?.on('message', this.onParentPortMessage);
        }
    }

    public connect(port: MessagePort): void {
        this.worker?.postMessage(
            {
                application: 'IndexApp',
                type: 'command',
                name: 'connect',
                args: { port },
            } satisfies CommandData,
            [port],
        );
    }

    public getDocumentCount(endpoint?: string): Promise<number> {
        return this.invoke('GetDocumentCount', { endpoint }) as Promise<number>;
    }

    public getEndpoints(): Promise<AASEndpoint[]> {
        return this.invoke('GetEndpoints', {}) as Promise<AASEndpoint[]>;
    }

    public getEndpointCount(): Promise<number> {
        return this.invoke('GetEndpointCount', {}) as Promise<number>;
    }

    public getEndpoint(name: string): Promise<AASEndpoint> {
        return this.invoke('GetEndpoint', { name }) as Promise<AASEndpoint>;
    }

    public findEndpoint(name: string): Promise<AASEndpoint | undefined> {
        return this.invoke('FindEndpoint', { name }) as Promise<AASEndpoint | undefined>;
    }

    public insertEndpoint(endpoint: AASEndpoint): Promise<void> {
        return this.invoke('InsertEndpoint', { endpoint }) as Promise<void>;
    }

    public updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint> {
        return this.invoke('UpdateEndpoint', { endpoint }) as Promise<AASEndpoint>;
    }

    public deleteEndpoint(endpoint: string): Promise<boolean> {
        return this.invoke('DeleteEndpoint', { endpoint }) as Promise<boolean>;
    }

    public getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPagedResult> {
        return this.invoke('GetDocuments', { cursor, query, language }) as Promise<AASPagedResult>;
    }

    public getEndpointDocuments(
        endpoint: string,
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<AASDocument>> {
        return this.invoke('GetEndpointDocuments', { endpoint, cursor, limit }) as Promise<PagedResult<AASDocument>>;
    }

    public update(document: AASDocument): Promise<void> {
        return this.invoke('Update', { document }) as Promise<void>;
    }

    public insert(document: AASDocument): Promise<void> {
        return this.invoke('Insert', { document }) as Promise<void>;
    }

    public create(endpoint: string, id: string, env: aas.Environment): Promise<void> {
        return this.invoke('Create', { endpoint, id, env }) as Promise<void>;
    }

    public find(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument | undefined> {
        return this.invoke('Find', { endpoint, modelType, id }) as Promise<AASDocument | undefined>;
    }

    public get(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument> {
        return this.invoke('Get', { endpoint, modelType, id }) as Promise<AASDocument>;
    }

    public delete(endpoint?: string, id?: string): Promise<boolean> {
        return this.invoke('Delete', { endpoint, id }) as Promise<boolean>;
    }

    public clear(endpoint?: string, id?: string): Promise<void> {
        return this.invoke('Clear', { endpoint, id }) as Promise<void>;
    }

    public getSubmodelConceptDescriptionIds(endpoint: string, id: string): Promise<string[]> {
        return this.invoke('GetSubmodelConceptDescriptionIds', { endpoint, id }) as Promise<string[]>;
    }

    public setSubmodelConceptDescriptionIds(
        endpoint: string,
        id: string,
        conceptDescriptionIds: string[],
    ): Promise<void> {
        return this.invoke('SetSubmodelConceptDescriptionIds', {
            endpoint,
            id,
            conceptDescriptionIds,
        }) as Promise<void>;
    }

    public dispose(): void {
        this.port.off('message', this.onMessage);
        if (this.worker) {
            this.worker.postMessage({
                application: 'IndexApp',
                type: 'command',
                name: 'shutdown',
                args: {},
            } satisfies CommandData);

            this.worker.once('exit', this.onWorkerExit);
        }
    }

    private readonly onParentPortMessage = (data: WorkerData): void => {
        if (isCommandData(data) && data.name === 'connect') {
            this.port = data.args.port as MessagePort;
            this.port.on('message', this.onMessage);
        }
    };

    private readonly onWorkerMessage = (data: WorkerData): void => {
        if (isResponseData(data)) {
            if (data.command === 'shutdown') {
                this.worker?.terminate();
            }
        }
    };

    private invoke(name: CommandName, args: Record<string, unknown>): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const id = this.nextId();
            const handle = setTimeout(() => {
                const entry = this.pending.get(id);
                if (entry) {
                    this.pending.delete(id);
                    entry.reject(new Error(`Request "${name}" timed out.`));
                }
            }, 60000);

            this.pending.set(id, { resolve, reject, handle });
            this.port.postMessage({ id, type: 'command', name, args } satisfies ChannelCommand);
        });
    }

    private nextId(): number {
        if (this.id >= Number.MAX_SAFE_INTEGER) {
            this.id = 0;
            return this.id;
        }

        return this.id++;
    }

    private readonly onMessage = (data: ChannelResponse | ChannelError): void => {
        const value = this.pending.get(data.id);
        if (!value) {
            return;
        }

        clearTimeout(value.handle);
        this.pending.delete(data.id);
        if (isChannelError(data)) {
            return value.reject(new Error(data.message));
        }

        value.resolve(data.result);
    };

    private readonly onWorkerError = (error: unknown): void => {
        const reason = error instanceof Error ? error : new Error(String(error));
        for (const { reject } of this.pending.values()) {
            reject(reason);
        }

        this.pending.clear();
    };

    private readonly onWorkerExit = (exitCode: number): void => {
        if (this.pending.size === 0) {
            return;
        }

        const error = new Error(`AAS index worker exited with code ${exitCode}.`);
        for (const { reject } of this.pending.values()) {
            reject(error);
        }

        this.pending.clear();
    };
}
