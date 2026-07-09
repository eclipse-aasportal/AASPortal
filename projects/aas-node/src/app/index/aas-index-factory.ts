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
    private static instance?: AASIndex;

    public static getInstance(container: DependencyContainer): AASIndex {
        if (!AASIndexFactory.instance) {
            const variable = container.resolve(Variable);
            const logger = container.resolve<Logger>(LOGGER);
            const keywordDirectory = container.resolve(KeywordDirectory);
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
            AASIndexFactory.instance = new SqliteIndex(logger, keywordDirectory, dbFile);
        }

        return AASIndexFactory.instance;
    }
}
