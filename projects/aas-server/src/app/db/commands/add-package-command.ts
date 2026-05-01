/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { nanoid } from 'nanoid';
import { types } from 'aas-core';

import { Database } from '../database.js';
import { AasxPackage } from '../../aasx-package.js';
import { PackageCommand } from './package-command.js';

export class AddPackageCommand extends PackageCommand {
    private readonly packageId = nanoid();

    public constructor(
        database: Database,
        resolve: (result: string) => void,
        reject: (reason: Error) => void,
        private readonly sourceFile: string,
        private readonly filename: string,
        private readonly env?: types.Environment,
    ) {
        super(database, resolve, reject);
    }

    public async execute(): Promise<string> {
        this.packageKey = await this.database.packageIndex.create(this.packageId, { filename: this.filename });
        this.aasx = await AasxPackage.createFromFile(this.sourceFile);
        const env = this.env ?? (await this.aasx.getEnvironment());
        if (env.assetAdministrationShells) {
            for (const shell of env.assetAdministrationShells) {
                await this.addShell(shell);
            }
        }

        if (env.submodels) {
            for (const submodel of env.submodels) {
                await this.addSubmodel(submodel);
            }
        }

        if (env.conceptDescriptions) {
            for (const conceptDescription of env.conceptDescriptions) {
                await this.addConceptDescription(conceptDescription);
            }
        }

        return this.packageId;
    }
}
