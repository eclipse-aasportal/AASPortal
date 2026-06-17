/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type DatabaseKey = number;

export const Table = {
    AAS_TABLE: 0,
    SUBMODEL_TABLE: 1,
    CONCEPT_DESCRIPTION_TABLE: 2,
} as const;

export type Table = (typeof Table)[keyof typeof Table];

export const Index = {
    PACKAGE_INDEX: 0,
    ASSET_INDEX: 1,
} as const;

export type Index = (typeof Index)[keyof typeof Index];

export type KeyListItem = DatabaseKey | [DatabaseKey, DatabaseKey];

export interface DatabaseTableData {
    nextKey: DatabaseKey;
    size: number;
    recycled: KeyListItem[];
    capacity: number;
}

export type DatabaseIndexData = DatabaseTableData;

export interface DatabaseData {
    version: string;
    format: 'json' | 'binary';
    pageSize: number;
    shells: DatabaseTableData;
    submodels: DatabaseTableData;
    conceptDescriptions: DatabaseTableData;
    assetIndex: DatabaseIndexData;
    packageIndex: DatabaseIndexData;
}

/** A row or item in the database.  */
export interface DatabaseItem extends Record<string, unknown> {
    /** The key in the table. */
    key: DatabaseKey;
    /** The identifier of the table item. */
    id: string;
}

/** A row or item in a database table. */
export interface DataTableItem extends DatabaseItem {
    indexRefs: IndexRef[];
}

export interface DatabasePage<TItem extends DatabaseItem> {
    page: number;
    count: number;
    items: (TItem | null)[];
}

/** A page of an database table. */
export type TablePage<TItem extends DataTableItem> = DatabasePage<TItem>;

/** A reference to a table item. */
export type TableRef = [Table, DatabaseKey];

/** A reference to an index entry. */
export type IndexRef = [Index, DatabaseKey];

/** An entry in an index. */
export interface IndexItem extends DatabaseItem {
    tableRefs: TableRef[];
}

/** A page of a database index. */
export type IndexPage = DatabasePage<IndexItem>;

export interface IdentifiableItem extends DataTableItem {
    /** The short name of the identifiable. */
    idShort: string | null;
}

export type HashTableKeyValue = [string, DatabaseKey];

export type HashTableBucket = HashTableKeyValue[];

export type HashTablePage = (HashTableBucket | null)[];
