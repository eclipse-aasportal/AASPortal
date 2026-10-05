/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/**
 * Defines the interface for generating the conditions for searching of AAS documents in the AAS index database.
 */
export interface ConditionGenerator {
    /**
     * Creates a WHERE clause for SQL queries based on the provided filter expression.
     * @param values The values to be used in the SQL statement.
     * @returns A string representing the conditions for searching in the AAS index database.
     */
    generate(values: unknown[]): string;
}
