/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, toJsonValue, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { DatabaseKey, IdentifiableItem, TablePage } from '../database-types.js';
import { ERROR } from '../../error.js';
import { SubmodelTable } from '../submodel-table.js';

export class AddSubmodelCommand extends DatabaseCommand<types.Submodel> {
    private readonly table: SubmodelTable;

    public constructor(
        database: Database,
        private readonly submodel: aas.Submodel,
    ) {
        super(database);

        this.table = this.database.submodels;
    }

    public override async execute(): Promise<types.Submodel> {
        const result = jsonization.submodelFromJsonable(toJsonValue(this.submodel));
        if (result.error) {
            throw new ApplicationError(ERROR.DESERIALIZATION_ERROR, { message: result.error.message });
        }

        if (!result.value) {
            throw new Error('Invalid operation.');
        }

        return await this.add(result.value);
    }

    private async add(sm: types.Submodel): Promise<types.Submodel> {
        let key = await this.table.getKey(sm.id);
        if (key) {
            throw new ApplicationError(ERROR.SUBMODEL_ALREADY_EXISTS, { id: sm.id }, 409);
        }

        key = this.table.createKey();
        const page = await this.table.getEditablePage(key);
        const item: IdentifiableItem = {
            key,
            id: sm.id,
            idShort: sm.idShort,
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

        await this.table.setKey(sm.id, key);
        await this.table.writeFile(sm, key);

        return sm;
    }

    private async getPage(key: DatabaseKey): Promise<TablePage<IdentifiableItem>> {
        const pageNumber = Math.trunc(key / this.table.pageSize);
        const page = await this.table.readPage(pageNumber);
        return page;
    }
}
