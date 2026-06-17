/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import path from 'path/posix';
import { LOGGER, Logger } from 'aas-package';

import { AASIndex } from './aas-index.js';
import { Variable } from '../variable.js';
import { MySqlIndex } from './mysql/mysql-index.js';
import { urlToString } from '../utilities.js';
import { KeywordDirectory } from './keyword-directory.js';
import { SqliteIndex } from './sqlite/sqlite-index.js';

export class AASIndexFactory {
    public constructor(private readonly container: DependencyContainer) {}

    public create(): AASIndex {
        const variable = this.container.resolve(Variable);
        const logger = this.container.resolve<Logger>(LOGGER);
        const keywordDirectory = this.container.resolve(KeywordDirectory);
        if (variable.AAS_INDEX) {
            try {
                const url = new URL(variable.AAS_INDEX);
                if (url.protocol === 'mysql:') {
                    return new MySqlIndex(logger, variable, keywordDirectory);
                }

                throw new Error(`${urlToString(url)} is a not supported AAS index.`);
            } catch (error) {
                logger.error(error);
            }
        }

        const dbFile = path.join(variable.CONTENT_ROOT, 'aas-index.db');
        return new SqliteIndex(logger, keywordDirectory, dbFile);
    }
}
