/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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
    public abstract createDocument(): Promise<AASDocument>;

    /**
     * Gets the thumbnail of the current Asset Administration Shell.
     * @param id The identifier of AAS.
     */
    public abstract getThumbnail(id: string): Promise<NodeJS.ReadableStream>;

    /**
     * Returns a read-only stream of a file in a package with the specified path.
     * @param env The Asset Administration Shell Environment.
     * @param file The File element.
     * @returns A readable stream.
     */
    public abstract openReadStream(env: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream>;

    /**
     * Gets the AAS environment from the package.
     * */
    public abstract getEnvironment(): Promise<aas.Environment>;

    /**
     * Updates or creates the elements contained in the specified AAS environment.
     * @param id The unique identifier of the AAS to which the environment belongs.
     * @param env The AAS environment.
     */
    public abstract setEnvironment(id: string, env: aas.Environment): Promise<void>;

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
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : Buffer.from(chunk));
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
                    case 'Property': {
                        const property: aas.Property = { ...(referable as aas.Property) };
                        if (property.category !== 'CONSTANT' && property.category !== 'PARAMETER') {
                            delete property.value;
                        }

                        crc.add(JSON.stringify(property));
                        break;
                    }
                    case 'Submodel': {
                        const sm: aas.Submodel = { ...(referable as aas.Submodel) };
                        delete sm.submodelElements;
                        crc.add(JSON.stringify(sm));
                        break;
                    }
                    case 'SubmodelElementCollection': {
                        const collection: aas.SubmodelElementCollection = {
                            ...(referable as aas.SubmodelElementCollection),
                        };
                        delete collection.value;
                        crc.add(JSON.stringify(collection));
                        break;
                    }
                    case 'SubmodelElementList': {
                        const list: aas.SubmodelElementList = { ...(referable as aas.SubmodelElementList) };
                        delete list.value;
                        crc.add(JSON.stringify(list));
                        break;
                    }
                    case 'AnnotatedRelationshipElement': {
                        const element: aas.AnnotatedRelationshipElement = {
                            ...(referable as aas.AnnotatedRelationshipElement),
                        };

                        delete element.annotations;
                        crc.add(JSON.stringify(element));
                        break;
                    }
                    case 'Entity': {
                        const entity: aas.Entity = {
                            ...(referable as aas.Entity),
                        };

                        delete entity.statements;
                        crc.add(JSON.stringify(entity));
                        break;
                    }
                    default:
                        crc.add(JSON.stringify(referable));
                        break;
                }
            }
        }

        return crc.end();
    }
}
