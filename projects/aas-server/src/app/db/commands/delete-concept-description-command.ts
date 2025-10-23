/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';
import { ConceptDescriptionTable } from '../concept-description-table.js';

export class DeleteConceptDescriptionCommand extends DatabaseCommand<void> {
    private readonly table: ConceptDescriptionTable;

    public constructor(
        database: Database,
        private readonly id: string,
    ) {
        super(database);

        this.table = this.database.conceptDescriptions;
    }

    public override async execute(): Promise<void> {
        const key = await this.table.findKey(this.id);
        if (!key) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_DOES_NOT_EXIST, { id: this.id }, 404);
        }

        const index = key % this.table.pageSize;
        const page = await this.table.getEditablePage(key);
        page.items[index] = null;
        await this.table.deleteFile(key);
        await this.table.deleteKey(this.id);
        return void 0;
    }
}
