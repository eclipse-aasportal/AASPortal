/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { types } from 'aas-core';

import { XmlWriter } from './xml-writer.js';
import { Variable } from './variable.js';
import { AasxPackage } from './aasx-package.js';
import { toEnvironment } from './utilities.js';

@singleton()
export class AasxPackageBuilder {
    public constructor(@inject(Variable) private readonly variable: Variable) {}

    private get rels(): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="/thumbnail.png" Id="${uuid}" />
    <Relationship Type="http://admin-shell.io/aasx/relationships/aasx-origin" Target="/aasx/aasx-origin" Id="${uuid()}" />
</Relationships>`;
    }

    private get aasxRels(): string {
        return `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Type="http://admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/data.xml" Id="${uuid()}"/>
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
     * Creates a new AASX package file.
     * @param file The destination file.
     * @param env The AAS environment.
     * @returns An AASX package.
     */
    public async create(file: string, env?: types.Environment): Promise<AasxPackage> {
        if (fs.existsSync(file)) {
            throw new Error('Invalid operation.');
        }

        if (!env) {
            env = new types.Environment([], [], []);
        }

        const aasx = new AasxPackage(file);
        const zip = await aasx.zip;
        const writer = new XmlWriter();
        const xml = writer.write(toEnvironment(env));
        zip.file('_rels/.rels', this.rels);
        zip.file('thumbnail.png', await fs.promises.readFile(path.join(this.variable.ASSETS, 'thumbnail.png')));
        zip.file('[Content_Types].xml', this.contentTypes);
        zip.file('aasx/_rels/aasx-origin.rels', this.aasxRels);
        zip.file('aasx/data.xml', xml);
        zip.file('aasx/aasx-origin', 'Intentionally empty.');
        zip.folder('aasx/suppl');
        await aasx.save();
        return aasx;
    }
}
