/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { nanoid } from 'nanoid';
import fs from 'fs';
import { Database } from '../app/db/database.js';
import { Variable } from '../app/variable.js';
import { createSpyObj } from './mocks.js';
import { fileURLToPath } from 'url';

export async function createDatabase(): Promise<Database> {
    const tmpDir = fileURLToPath(new URL(`./assets/tmp/${nanoid()}`, import.meta.url));
    if (fs.existsSync(tmpDir)) {
        await fs.promises.rm(tmpDir, { recursive: true });
    }

    await fs.promises.cp(fileURLToPath(new URL(`./assets/data`, import.meta.url)), tmpDir, { recursive: true });
    const db = new Database(createSpyObj<Variable>({}, { DATA: tmpDir, PAGE_SIZE: 100 }));
    await db.ready();
    return db;
}
