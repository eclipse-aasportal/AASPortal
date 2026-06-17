/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, toJsonValue, ApplicationError, types, jsonization, toConceptDescription } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';
import { ConceptDescriptionTable } from '../concept-description-table.js';

export class AddConceptDescriptionCommand extends DatabaseCommand {
    private readonly table: ConceptDescriptionTable;

    public constructor(
        database: Database,
        resolve: (result: types.ConceptDescription) => void,
        reject: (reason: Error) => void,
        private readonly conceptDescription: aas.ConceptDescription,
    ) {
        super(database, resolve, reject);

        this.table = this.database.conceptDescriptions;
    }

    public override async execute(): Promise<types.ConceptDescription> {
        const result = jsonization.conceptDescriptionFromJsonable(toJsonValue(this.conceptDescription));
        if (result.error) {
            throw new ApplicationError(ERROR.DESERIALIZATION_ERROR);
        }

        if (!result.value) {
            throw new Error('Invalid operation.');
        }

        return await this.add(result.value);
    }

    private async add(cd: types.ConceptDescription): Promise<types.ConceptDescription> {
        const key = await this.table.findKey(cd.id);
        if (key) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_ALREADY_EXISTS, { id: cd.id }, 409);
        }

        await this.table.insert(toConceptDescription(cd));
        return cd;
    }
}
