/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, types, jsonization, toJsonValue, ApplicationError } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { IdentifiableItem } from '../database-types.js';
import { ERROR } from '../../error.js';
import { ConceptDescriptionTable } from '../concept-description-table.js';

export class AddConceptDescriptionCommand extends DatabaseCommand<types.ConceptDescription> {
    private readonly table: ConceptDescriptionTable;

    public constructor(
        database: Database,
        private readonly conceptDescription: aas.ConceptDescription,
    ) {
        super(database);

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
        let key = await this.table.findKey(cd.id);
        if (key) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_ALREADY_EXISTS, { id: cd.id }, 409);
        }

        key = this.table.createKey();
        const page = await this.table.getEditablePage(key);
        const item: IdentifiableItem = {
            key,
            id: cd.id,
            idShort: cd.idShort,
            packageKeys: [],
        };

        const index = key % this.table.pageSize;
        ++page.count;
        if (index < page.items.length) {
            page.items[index] = item;
        } else if (index === page.items.length) {
            page.items.push(item);
        } else {
            throw new Error('Invalid operation.');
        }

        await this.table.setKey(cd.id, key);
        await this.table.writeFile(cd, key);

        return cd;
    }
}
