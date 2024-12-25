/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    BrowseDirection,
    Byte,
    ClientSession,
    DataType,
    Int32,
    NodeId,
    ResultMask,
    StatusCodes,
    VariantArrayType,
} from 'node-opcua';

export enum OpenFileMode {
    Read = 1,
}

export class ClientFile {
    private readonly fileNodeId: NodeId;
    private fileHandle = 0;
    private openMethodNodeId?: NodeId;
    private closeMethodNodeId?: NodeId;
    private readMethodNodeId?: NodeId;

    public constructor(
        private session: ClientSession,
        fileNodeId: NodeId | string,
    ) {
        this.fileNodeId = NodeId.resolveNodeId(fileNodeId);
    }

    public async open(mode: OpenFileMode): Promise<number> {
        if (mode == null) {
            throw new Error('Invalid mode.');
        }

        if (this.fileHandle) {
            throw new Error('File is already open.');
        }

        if (!this.openMethodNodeId) {
            await this.ensureInitialized();
        }

        const result = await this.session.call({
            inputArguments: [{ dataType: DataType.Byte, value: mode as Byte }],
            methodId: this.openMethodNodeId,
            objectId: this.fileNodeId,
        });

        if (result.statusCode !== StatusCodes.Good) {
            throw new Error(
                'cannot open file statusCode = ' + result.statusCode.toString() + ' mode = ' + OpenFileMode[mode],
            );
        }

        this.fileHandle = result.outputArguments![0].value;

        return this.fileHandle;
    }

    public async close(): Promise<void> {
        if (!this.fileHandle) {
            throw new Error('File has not been opened yet');
        }

        if (!this.closeMethodNodeId) {
            await this.ensureInitialized();
        }

        const result = await this.session.call({
            inputArguments: [{ dataType: DataType.UInt32, value: this.fileHandle }],
            methodId: this.closeMethodNodeId,
            objectId: this.fileNodeId,
        });

        if (result.statusCode !== StatusCodes.Good) {
            throw new Error('Cannot close file: statusCode = ' + result.statusCode.toString());
        }

        this.fileHandle = 0;
    }

    public async read(bytesToRead: Int32): Promise<Buffer> {
        if (!this.readMethodNodeId) {
            await this.ensureInitialized();
        }

        if (!this.fileHandle) {
            throw new Error('File has not been opened yet.');
        }

        const result = await this.session.call({
            inputArguments: [
                { dataType: DataType.UInt32, value: this.fileHandle },
                {
                    arrayType: VariantArrayType.Scalar,
                    dataType: DataType.Int32,
                    value: bytesToRead,
                },
            ],
            methodId: this.readMethodNodeId,
            objectId: this.fileNodeId,
        });

        if (result.statusCode !== StatusCodes.Good) {
            throw new Error(result.statusCode.toString());
        }

        if (!result.outputArguments || result.outputArguments[0].dataType !== DataType.ByteString) {
            throw new Error('Invalid output arguments.');
        }

        return result.outputArguments![0].value as Buffer;
    }

    private async ensureInitialized(): Promise<void> {
        const result = await this.session.browse({
            browseDirection: BrowseDirection.Forward,
            nodeId: this.fileNodeId,
            resultMask: ResultMask.BrowseName | ResultMask.TypeDefinition,
        });

        if (result.references) {
            for (const node of result.references) {
                switch (node.browseName.name) {
                    case 'Open':
                        this.openMethodNodeId = node.nodeId;
                        break;
                    case 'Close':
                        this.closeMethodNodeId = node.nodeId;
                        break;
                    case 'Read':
                        this.readMethodNodeId = node.nodeId;
                        break;
                }
            }
        }
    }
}
