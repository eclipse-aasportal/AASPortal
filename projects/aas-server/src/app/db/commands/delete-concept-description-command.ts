/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ConceptDescriptionTable } from '../concept-description-table.js';

export class DeleteConceptDescriptionCommand extends DatabaseCommand {
    private readonly table: ConceptDescriptionTable;

    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly id: string,
    ) {
        super(database, resolve, reject);

        this.table = this.database.conceptDescriptions;
    }

    public override async execute(): Promise<void> {
        await this.table.delete(this.id);
    }
}