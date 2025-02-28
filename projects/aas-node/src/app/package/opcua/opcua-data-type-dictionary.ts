/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';
import {
    BrowseDescriptionLike,
    ClientSession,
    NodeClass,
    NodeIdLike,
    ReferenceDescription,
    resolveNodeId,
} from 'node-opcua';

interface DataTypeEntry {
    obj: ReferenceDescription;
    name: string;
    baseType: string | null;
}

export class OpcuaDataTypeDictionary {
    private readonly dataTypes: Map<string, DataTypeEntry> = new Map<string, DataTypeEntry>();

    public get(nodeId: NodeIdLike | null | undefined): aas.DataTypeDefXsd {
        let entry: DataTypeEntry | undefined;
        if (nodeId) {
            entry = this.dataTypes.get(resolveNodeId(nodeId).toString());
        }

        return this.toDataTypeDefXsd(entry?.name);
    }

    public async initializeAsync(session: ClientSession): Promise<void> {
        this.dataTypes.clear();
        await this.browseAsync(session, 'DataTypesFolder');
    }

    private async browseAsync(session: ClientSession, nodeToBrowse: BrowseDescriptionLike): Promise<void> {
        const result = await session.browse(nodeToBrowse);
        if (result.references) {
            for (const obj of result.references) {
                if (obj.nodeClass === NodeClass.DataType && obj.browseName.name) {
                    this.dataTypes.set(obj.nodeId.toString(), {
                        obj: obj,
                        name: obj.browseName.name,
                        baseType: null,
                    });
                }

                if (obj.nodeClass === NodeClass.Object || obj.nodeClass === NodeClass.DataType) {
                    await this.browseAsync(session, obj.nodeId.toString());
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private toDataTypeDefXsd(name: string | undefined): aas.DataTypeDefXsd {
        throw new Error('Method not implemented.');
    }
}
