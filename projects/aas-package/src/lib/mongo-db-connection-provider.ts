/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import mongoose from 'mongoose';
import { LOGGER } from './logging/logger.js';

/**
 * Provides MongoDB connections based on URLs. Connections are cached to avoid creating multiple
 * connections for the same URL.
 */
@singleton()
export class MongoDBConnectionProvider {
    private readonly logger = container.resolve(LOGGER);
    private connections: Map<string, mongoose.Connection> = new Map();

    public getConnection(url: string): mongoose.Connection {
        let connection = this.connections.get(url);
        if (!connection) {
            const value = new URL(url);
            connection = this.connect(value);
            this.connections.set(url, connection);
            this.logger.info(`Created new MongoDB connection for URL ${value.protocol}://${value.host}`);
        }

        return connection;
    }

    private connect(url: URL): mongoose.Connection {
        const username = url.username;
        const password = url.password;
        const dbName = url.pathname.substring(1);
        url.username = '';
        url.password = '';
        url.pathname = '';
        return mongoose.createConnection(url.href, {
            dbName: dbName,
            user: username,
            pass: password,
        });
    }
}
