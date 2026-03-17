/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { toEnvironment, types } from 'aas-core';

import { XmlWriterV3 } from './writer/xml-writer-v3.js';
import { AasxFile } from './aasx-file.js';

/**
 * Abstract class for building AASX (Asset Administration Shell XML) files.
 * Provides functionality to create and save AASX files with proper XML structure and relationships.
 *
 * @template T - Type extending AasxFile that represents the specific AASX file implementation
 *
 * @remarks
 * The builder creates AASX files following the AAS (Asset Administration Shell) specification,
 * including necessary XML relationships, content types, and file structure.
 *
 * @example
 * ```typescript
 * class CustomAasxBuilder extends AasxFileBuilder<CustomAasxFile> {
 *   protected async create(file: string): Promise<CustomAasxFile> {
 *     return new CustomAasxFile(file);
 *   }
 * }
 * const builder = new CustomAasxBuilder('assets/path');
 * const aasxFile = await builder.build('output.aasx', environment);
 * ```
 *
 * @public
 */
export abstract class AasxFileBuilder<T extends AasxFile> {
    public constructor(private readonly assets: string) {}

    private get rels(): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="/thumbnail.png" Id="${nanoid()}" />
    <Relationship Type="http://admin-shell.io/aasx/relationships/aasx-origin" Target="/aasx/aasx-origin" Id="${nanoid()}" />
</Relationships>`;
    }

    private get aasxRels(): string {
        return `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Type="http://admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/data.xml" Id="${nanoid()}"/>
</Relationships>`;
    }

    private get contentTypes(): string {
        return `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="text/xml"/>
    <Default Extension="png" ContentType="image/png"/>
    <Override PartName="/aasx/aasx-origin" ContentType="text/plain"/>
</Types>`;
    }

    /**
     * Builds and saves an AASX file with the given environment.
     * Creates a new AASX file at the specified path with the provided environment data.
     * If no environment is provided, creates an empty environment.
     *
     * @param file - The file path where the AASX file should be created
     * @param env - Optional environment containing the AAS data to be included in the AASX file
     * @returns Promise resolving to the created AASX file instance
     * @throws Error if the file already exists at the specified path
     */
    public async build(file: string, env?: types.Environment): Promise<T> {
        if (fs.existsSync(file)) {
            throw new Error('Invalid operation.');
        }

        if (!env) {
            env = new types.Environment([], [], []);
        }

        const aasx = await this.create(file);
        const zip = await aasx.zip;
        const writer = new XmlWriterV3();
        const xml = writer.write(toEnvironment(env));
        zip.file('_rels/.rels', this.rels);
        zip.file('thumbnail.png', await fs.promises.readFile(path.join(this.assets, 'thumbnail.png')));
        zip.file('[Content_Types].xml', this.contentTypes);
        zip.file('aasx/_rels/aasx-origin.rels', this.aasxRels);
        zip.file('aasx/data.xml', xml);
        zip.file('aasx/aasx-origin', 'Intentionally empty.');
        await aasx.save();
        return aasx;
    }

    protected abstract create(file: string): Promise<T>;
}
