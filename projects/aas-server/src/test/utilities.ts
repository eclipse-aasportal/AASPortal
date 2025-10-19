/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { v4 as uuid } from 'uuid';
import { resolve } from 'path';
import fs from 'fs';
import { Database } from '../app/db/database.js';
import { createSpyObj } from './create-spy-obj.js';
import { Variable } from '../app/variable.js';

export async function createDatabase(): Promise<Database> {
    const tmpDir = resolve(`./src/test/assets/tmp/${uuid()}`);
    if (fs.existsSync(tmpDir)) {
        await fs.promises.rm(tmpDir, { recursive: true });
    }

    await fs.promises.cp(resolve(`./src/test/assets/data`), tmpDir, { recursive: true });
    const db = new Database(createSpyObj<Variable>({}, { DATA: tmpDir, PAGE_SIZE: 100 }));
    await db.ready();
    return db;
}
