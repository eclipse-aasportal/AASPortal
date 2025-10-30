/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type DatabaseKey = number;

export type KeyListItem = DatabaseKey | [DatabaseKey, DatabaseKey];

export type DatabaseTableData = {
    nextKey: DatabaseKey;
    size: number;
    recycled: KeyListItem[];
    capacity: number;
};

export type DatabaseData = {
    pageSize: number;
    packages: DatabaseTableData;
    shells: DatabaseTableData;
    submodels: DatabaseTableData;
    conceptDescriptions: DatabaseTableData;
};

export type TablePage<TItem extends DataTableItem> = {
    key: DatabaseKey;
    count: number;
    items: (TItem | null)[];
};

export type DatabaseEnvironment = {
    assetAdministrationShells: DatabaseKey[];
    submodels: DatabaseKey[];
    conceptDescriptions: DatabaseKey[];
};

export interface DataTableItem {
    /** The key in the table. */
    key: DatabaseKey;
    /** The identifier of the table item. */
    id: string;
}

export interface PackageItem extends DataTableItem {
    id: string;
    filename: string;
    environment: DatabaseEnvironment;
}

export interface IdentifiableItem extends DataTableItem {
    /** The short name of the identifiable. */
    idShort: string | null;
    /** The keys of the packages that reference this identifiable. */
    packageKeys: KeyListItem[];
}

export type HashTableKeyValue = [string, DatabaseKey];

export type HashTableBucket = HashTableKeyValue[];

export type HashTablePage = (HashTableBucket | null)[];
