/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { aas, PagedResult, types } from 'aas-core';

import { Database } from './db/database.js';
import { Variable } from './variable.js';
import { AddConceptDescriptionCommand } from './db/commands/add-concept-description-command.js';
import { HttpCache } from './http-cache.js';
import { DeleteConceptDescriptionCommand } from './db/commands/delete-concept-description-command.js';

@singleton()
export class ConceptDescriptionRepository {
    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject(Database) private readonly db: Database,
        @inject(HttpCache) private readonly cache: HttpCache,
    ) {}

    public async getConceptDescriptions(limit?: number, cursor?: string): Promise<PagedResult<aas.ConceptDescription>> {
        const query = `?cursor=${cursor}&limit=${limit}`;
        let result = this.cache.getResult<aas.ConceptDescription>('/concept-descriptions', query);
        if (!result) {
            result = await this.db.getConceptDescriptions(limit, cursor);
            this.cache.setResult('/concept-descriptions', query, result);
        }

        return result;
    }

    public async getConceptDescription(id: string): Promise<aas.ConceptDescription> {
        const query = '';
        let conceptDescription = this.cache.getIdentifiable<aas.ConceptDescription>(id, query);
        if (!conceptDescription) {
            conceptDescription = await this.db.getConceptDescription(id);
            this.cache.setIdentifiable(query, conceptDescription);
        }

        return conceptDescription;
    }

    public addConceptDescription(conceptDescription: aas.ConceptDescription): Promise<types.ConceptDescription> {
        return new Promise((resolve, reject) => {
            const command = new AddConceptDescriptionCommand(this.db, resolve, reject, conceptDescription);
            this.db.execute(command);
            this.cache.remove('/concept-descriptions');
        });
    }

    public deleteConceptDescription(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = new DeleteConceptDescriptionCommand(this.db, resolve, reject, id);
            this.db.execute(command);
            this.cache.remove('/concept-descriptions');
        });
    }
}
