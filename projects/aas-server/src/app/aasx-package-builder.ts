/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AasxFileBuilder } from 'aas-package';
import { inject, singleton } from 'tsyringe';
import { Variable } from './variable.js';
import { AasxPackage } from './aasx-package.js';

@singleton()
export class AasxPackageBuilder extends AasxFileBuilder<AasxPackage> {
    public constructor(@inject(Variable) variable: Variable) {
        super(variable.ASSETS);
    }

    protected override async create(file: string): Promise<AasxPackage> {
        return await AasxPackage.createFromFile(file);
    }
}
