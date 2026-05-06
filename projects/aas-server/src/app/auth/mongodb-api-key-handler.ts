/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import mongoose from 'mongoose';
import { LOGGER, Logger, MongoDBConnectionProvider } from 'aas-package';

import { Variable } from '../variable.js';
import { ApiKeyHandler, ApiKeyRecord } from './api-key-handler.js';

interface ApiKeyDocument extends ApiKeyRecord, mongoose.Document {}

@singleton()
export class MongoDBApiKeyManager extends ApiKeyHandler {
    private readonly connection: mongoose.Connection;
    private readonly model: mongoose.Model<ApiKeyDocument>;

    private readonly schema = new mongoose.Schema<ApiKeyDocument>({
        key: { type: String, required: true, unique: true },
        label: { type: String, required: true },
        rules: { type: String, required: true },
        createdAt: { type: String, required: true },
    });

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(MongoDBConnectionProvider) connectionProvider: MongoDBConnectionProvider,
        @inject(Variable) variable: Variable,
    ) {
        super();

        this.connection = connectionProvider.getConnection(variable.API_KEY_HANDLER!);
        this.model = this.connection.model<ApiKeyDocument>('ApiKeys', this.schema);
        this.logger.info('Using MongoDB API key handler');
    }

    public override async create(label: string, rules: string | Record<string, unknown>): Promise<string> {
        const key = this.generateKey();
        const rulesStr = typeof rules === 'string' ? rules : JSON.stringify(rules);
        const createdAt = new Date().toISOString();
        const record = new this.model({ key, label, rules: rulesStr, createdAt });
        await record.save();
        return key;
    }

    public override async get(key: string): Promise<ApiKeyRecord | undefined> {
        const record = await this.model.findOne({ key }).exec();
        if (!record) {
            return undefined;
        }

        return {
            key: String(record.key),
            label: String(record.label),
            rules: JSON.parse(String(record.rules)),
            createdAt: String(record.createdAt),
        };
    }

    public override async revokeKey(key: string): Promise<boolean> {
        const result = await this.model.findOneAndDelete({ key }).exec();
        return result != null;
    }
}
