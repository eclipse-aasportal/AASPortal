/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Query, QueryParser } from 'common';

export abstract class AASIndexQuery {
    protected constructor(query: string, protected readonly language: string) {
        this.queryParser = new QueryParser(query, language);
    }

    protected readonly queryParser: QueryParser;

    protected isText(value: unknown): value is string {
        return typeof value === 'string';
    }

    protected isQuery(value: unknown): value is Query {
        return typeof value === 'object' && !Array.isArray(value);
    }
}