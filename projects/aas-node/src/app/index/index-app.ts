/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { parentPort, MessagePort } from 'worker_threads';
import { aas, AASCursor, AASDocument, AASEndpoint } from 'aas-core';
import { LOGGER } from 'aas-package';
import { AAS_INDEX, ChannelCommand, ChannelError, ChannelResponse, IAASIndex, CommandName } from './aas-index.js';
import { CommandData, ResponseData, ErrorData } from '../types.js';

@singleton()
export class IndexApp {
    private readonly index: IAASIndex = container.resolve(AAS_INDEX);
    private readonly logger = container.resolve(LOGGER);
    private readonly messageQueue: [MessagePort, ChannelCommand][] = [];
    private readonly ports: MessagePort[] = [];

    public constructor() {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    private readonly parentPortOnMessage = (data: CommandData): void => {
        try {
            if (data.type === 'command') {
                if (data.name === 'connect') {
                    const port = data.args.port as MessagePort;
                    port.on('message', data => this.onMessage(port, data));
                    this.ports.push(port);
                    this.logger.info(`Client ${data.args.name} connected.`);
                } else if (data.name === 'shutdown') {
                    this.ports.forEach(port => {
                        port.removeAllListeners('message');
                        port.close();
                    });

                    parentPort?.postMessage({
                        application: 'IndexApp',
                        type: 'response',
                        command: 'shutdown',
                        result: 'IndexApp shutdown complete.',
                    } satisfies ResponseData);

                    process.exit(0);
                }
            }
        } catch (error) {
            parentPort?.postMessage({
                application: 'IndexApp',
                type: 'error',
                message: error.message,
            } satisfies ErrorData);
        }
    };

    private readonly onMessage = (port: MessagePort, data: ChannelCommand): void => {
        this.messageQueue.push([port, data]);
        if (this.messageQueue.length === 1) {
            setImmediate(this.execute);
        }
    };

    private readonly execute = (): void => {
        const tuple = this.messageQueue.at(0);
        if (!tuple) {
            return;
        }

        const [port, data] = tuple;
        switch (data.name) {
            case 'GetDocumentCount':
                this.index
                    .getDocumentCount(data.args.endpoint as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'GetEndpoints':
                this.index
                    .getEndpoints()
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'GetEndpointCount':
                this.index
                    .getEndpointCount()
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'GetEndpoint':
                this.index
                    .getEndpoint(data.args.name as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'FindEndpoint':
                this.index
                    .findEndpoint(data.args.name as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'InsertEndpoint':
                this.index
                    .insertEndpoint(data.args.endpoint as AASEndpoint)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'UpdateEndpoint':
                this.index
                    .updateEndpoint(data.args.endpoint as AASEndpoint)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'DeleteEndpoint':
                this.index
                    .deleteEndpoint(data.args.endpoint as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'GetDocuments':
                this.index
                    .getDocuments(
                        data.args.cursor as AASCursor,
                        data.args.query as string,
                        data.args.language as string,
                    )
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'GetEndpointDocuments':
                this.index
                    .getEndpointDocuments(
                        data.args.endpoint as string,
                        data.args.cursor as string,
                        data.args.limit as number,
                    )
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Update':
                this.index
                    .update(data.args.document as AASDocument)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Insert':
                this.index
                    .insert(data.args.document as AASDocument)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Create':
                this.index
                    .create(data.args.endpoint as string, data.args.id as string, data.args.env as aas.Environment)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Find':
                this.index
                    .find(
                        data.args.endpoint as string,
                        data.args.modelType as 'AssetAdministrationShell' | 'Asset',
                        data.args.id as string,
                    )
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Get':
                this.index
                    .get(
                        data.args.endpoint as string,
                        data.args.modelType as 'AssetAdministrationShell' | 'Asset',
                        data.args.id as string,
                    )
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Delete':
                this.index
                    .delete(data.args.endpoint as string, data.args.id as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'Clear':
                this.index
                    .clear(data.args.endpoint as string, data.args.id as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'GetSubmodelConceptDescriptionIds':
                this.index
                    .getSubmodelConceptDescriptionIds(data.args.endpoint as string, data.args.id as string)
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            case 'SetSubmodelConceptDescriptionIds':
                this.index
                    .setSubmodelConceptDescriptionIds(
                        data.args.endpoint as string,
                        data.args.id as string,
                        data.args.conceptDescriptionIds as string[],
                    )
                    .then(result => this.postResult(port, data.id, data.name, result))
                    .catch(error => this.postError(port, data.id, error));
                break;
            default:
                this.postError(port, data.id, new Error(`Unknown command: ${data.name}`));
                break;
        }
    };

    private postResult(port: MessagePort, id: number, name: CommandName, result: unknown): void {
        port.postMessage({ id, type: 'response', name, result } satisfies ChannelResponse);
        this.messageQueue.shift();
        setImmediate(this.execute);
    }

    private postError(port: MessagePort, id: number, error: Error): void {
        port.postMessage({ id, type: 'error', message: error.message } satisfies ChannelError);
        this.messageQueue.shift();
        setImmediate(() => this.execute);
    }
}
