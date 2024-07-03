/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, Crc32, aas, flat } from 'aas-core';
import { Logger } from '../logging/logger.js';

/**
 * Represents a package that contains an Asset Administration Shell.
 */
export abstract class AASPackage {
    protected readonly logger: Logger;

    protected constructor(logger: Logger) {
        this.logger = logger;
    }

    /** Gets the document that contains an Asset Administration Shell. */
    public abstract createDocumentAsync(): Promise<AASDocument>;

    /**
     * Gets the thumbnail of the current Asset Administration Shell.
     * @param id The identifier of AAS.
     */
    public abstract getThumbnailAsync(id: string): Promise<NodeJS.ReadableStream>;

    /**
     * Returns a read-only stream of a file in a package with the specified path.
     * @param env The Asset Administration Shell Environment.
     * @param file The File element.
     * @returns A readable stream.
     */
    public abstract openReadStreamAsync(env: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream>;

    /**
     * Gets the AAS environment from the package.
     * */
    public abstract getEnvironmentAsync(): Promise<aas.Environment>;

    /**
     * Applies the state of the source document into the destination document.
     * @param env The new AAS environment.
     * @param reference The previous state.
     */
    public abstract setEnvironmentAsync(env: aas.Environment, reference?: aas.Environment): Promise<string[]>;

    protected normalize(path: string): string {
        path = path.replace(/\\/g, '/');
        if (path.charAt(0) === '/') {
            path = path.slice(1);
        } else if (path.startsWith('./')) {
            path = path.slice(2);
        }

        return path;
    }

    protected async streamToBase64(stream: NodeJS.ReadableStream): Promise<string> {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }

        return 'data:image/png;base64,' + Buffer.concat(chunks).toString('base64');
    }

    protected computeCrc32(env: aas.Environment): number {
        const crc = new Crc32();
        crc.start();

        for (const shell of env.assetAdministrationShells) {
            crc.add(JSON.stringify(shell));
        }

        for (const conceptDescription of env.conceptDescriptions) {
            crc.add(JSON.stringify(conceptDescription));
        }

        for (const submodel of env.submodels) {
            for (const referable of flat(submodel)) {
                switch (referable.modelType) {
                    case 'Property':
                        {
                            const property: aas.Property = { ...(referable as aas.Property) };
                            if (property.category !== 'CONSTANT' && property.category !== 'PARAMETER') {
                                delete property.value;
                            }

                            crc.add(JSON.stringify(property));
                        }
                        break;
                    case 'Submodel':
                        {
                            const sm: aas.Submodel = { ...(referable as aas.Submodel) };
                            delete sm.submodelElements;
                            crc.add(JSON.stringify(sm));
                        }
                        break;
                    case 'SubmodelElementCollection':
                        {
                            const collection: aas.SubmodelElementCollection = {
                                ...(referable as aas.SubmodelElementCollection),
                            };
                            delete collection.value;
                            crc.add(JSON.stringify(collection));
                        }
                        break;
                    case 'SubmodelElementList':
                        {
                            const list: aas.SubmodelElementList = { ...(referable as aas.SubmodelElementList) };
                            delete list.value;
                            crc.add(JSON.stringify(list));
                        }
                        break;
                    default:
                        crc.add(JSON.stringify(referable));
                        break;
                }
            }
        }

        return crc.end();
    }
}
