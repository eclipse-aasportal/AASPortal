/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { Variable } from '../variable.js';
import mongoose from 'mongoose';

@singleton()
export class MongoDBConnection {
    private readonly url: string;
    private connected = false;

    public constructor(@inject(Variable) variable: Variable) {
        if (!variable.USER_STORAGE) {
            throw new Error('Invalid operation.');
        }

        this.url = variable.USER_STORAGE;
    }

    public async ensureConnected(): Promise<void> {
        if (!this.connected) {
            await mongoose.connect(this.url);
            this.connected = true;
        }
    }
}
