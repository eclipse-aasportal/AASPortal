/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import path from 'path/posix';
import { LOGGER, Logger } from 'aas-package';

import { IAASIndex } from './aas-index.js';
import { Variable } from '../variable.js';
import { MySqlIndex } from './mysql/mysql-index.js';
import { urlToString } from '../utilities.js';
import { KeywordDirectory } from './keyword-directory.js';
import { SqliteIndex } from './sqlite/sqlite-index.js';

@singleton()
export class AASIndexFactory {
    private readonly variable = container.resolve(Variable);
    private readonly logger = container.resolve<Logger>(LOGGER);
    private readonly keywordDirectory = container.resolve(KeywordDirectory);
    private static instance?: IAASIndex;

    public getInstance(): IAASIndex {
        if (!AASIndexFactory.instance) {
            if (this.variable.AAS_INDEX) {
                try {
                    const url = new URL(this.variable.AAS_INDEX);
                    if (url.protocol === 'mysql:') {
                        return new MySqlIndex(this.logger, this.variable, this.keywordDirectory);
                    }

                    throw new Error(`${urlToString(url)} is a not supported AAS index.`);
                } catch (error) {
                    this.logger.error(error);
                }
            }

            const dbFile = path.join(this.variable.CONTENT_ROOT, 'aas-index.db');
            AASIndexFactory.instance = new SqliteIndex(this.logger, this.keywordDirectory, dbFile);
        }

        return AASIndexFactory.instance;
    }
}
