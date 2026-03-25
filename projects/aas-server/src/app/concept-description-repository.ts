/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { aas, ApplicationError, PagedResult, types } from 'aas-core';

import { Database } from './db/database.js';
import { Variable } from './variable.js';
import { AddConceptDescriptionCommand } from './db/commands/add-concept-description-command.js';
import { DeleteConceptDescriptionCommand } from './db/commands/delete-concept-description-command.js';
import { ERROR } from './error.js';

@singleton()
export class ConceptDescriptionRepository {
    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject(Database) private readonly db: Database,
    ) {}

    public async getConceptDescriptions(limit?: number, cursor?: string): Promise<PagedResult<aas.ConceptDescription>> {
        return await this.db.conceptDescriptions.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    public async getConceptDescription(id: string): Promise<aas.ConceptDescription> {
        const key = await this.db.conceptDescriptions.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_DOES_NOT_EXIST, { id }, 404);
        }

        return await this.db.conceptDescriptions.readObject(key);
    }

    public addConceptDescription(conceptDescription: aas.ConceptDescription): Promise<types.ConceptDescription> {
        return new Promise((resolve, reject) => {
            const command = new AddConceptDescriptionCommand(this.db, resolve, reject, conceptDescription);
            this.db.execute(command);
        });
    }

    public deleteConceptDescription(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = new DeleteConceptDescriptionCommand(this.db, resolve, reject, id);
            this.db.execute(command);
        });
    }
}
