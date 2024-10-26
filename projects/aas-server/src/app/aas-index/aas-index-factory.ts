/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import path from 'path/posix';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import { AASIndex } from './aas-index.js';
import { LowDbIndex } from './lowdb/lowdb-index.js';
import { Variable } from '../variable.js';
import { LowDbData } from './lowdb/lowdb-types.js';
import { MySqlIndex } from './mysql/mysql-index.js';
import { Logger } from '../logging/logger.js';
import { urlToString } from '../convert.js';
import { KeywordDirectory } from './keyword-directory.js';

export class AASIndexFactory {
    public constructor(private readonly container: DependencyContainer) {}

    public create(): AASIndex {
        const variable = this.container.resolve(Variable);
        const logger = this.container.resolve<Logger>('Logger');
        const keywordDirectory = this.container.resolve(KeywordDirectory);
        if (variable.AAS_INDEX) {
            try {
                const url = new URL(variable.AAS_INDEX);
                if (url.protocol === 'mysql:') {
                    const index = new MySqlIndex(keywordDirectory, variable);
                    logger.info(`AAS index connected to ${urlToString(url)}.`);
                    return index;
                }

                throw new Error(`${urlToString(url)} is a not supported AAS index.`);
            } catch (error) {
                logger.error(error);
            }
        }

        const dbFile = path.join(variable.CONTENT_ROOT, 'db.json');
        const db = new Low<LowDbData>(new JSONFile(dbFile), { documents: [], endpoints: [], elements: [] });
        const index = new LowDbIndex(db, keywordDirectory, variable);
        logger.info('Using internal AAS index.');
        return index;
    }
}
