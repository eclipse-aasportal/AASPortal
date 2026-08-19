/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aas } from 'aas-core';
import { EndpointScanDatabase } from './endpoint-scan-database.js';

describe('EndpointScanDatabase', () => {
    let db: EndpointScanDatabase;

    beforeEach(() => {
        db = new EndpointScanDatabase();
    });

    afterEach(() => {
        db.close();
    });

    it('should create a database', () => {
        expect(db).toBeInstanceOf(EndpointScanDatabase);
    });

    it('should track whether a shell was scanned and whether it changed', () => {
        expect(db.hasShell('shell-1')).toBe(false);
        expect(db.isShellChanged('shell-1')).toBe(false);

        db.setShellChanged('shell-1', true);

        expect(db.hasShell('shell-1')).toBe(true);
        expect(db.isShellChanged('shell-1')).toBe(true);
    });

    it('should update the changed state for an existing shell', () => {
        db.setShellChanged('shell-1', true);
        db.setShellChanged('shell-1', false);

        expect(db.hasShell('shell-1')).toBe(true);
        expect(db.isShellChanged('shell-1')).toBe(false);
    });

    it('should register submodels for shells and return the matching shell ids', () => {
        db.registerSubmodels([referenceTo('submodel-1'), referenceTo('submodel-2')], 'shell-1');
        db.registerSubmodels([referenceTo('submodel-1')], 'shell-2');

        expect(db.getSubmodelShellIds('submodel-1')).toEqual(['shell-1', 'shell-2']);
        expect(db.getSubmodelShellIds('submodel-2')).toEqual(['shell-1']);
        expect(db.getSubmodelShellIds('unknown-submodel')).toEqual([]);
    });

    it('should ignore submodel references without an id', () => {
        db.registerSubmodels([referenceWithoutKeys(), referenceTo('')], 'shell-1');

        expect(db.getSubmodelShellIds('')).toEqual([]);
        expect(db.getSubmodelShellIds('shell-1')).toEqual([]);
    });

    it('should register concept descriptions for shells and return the matching shell ids', () => {
        db.registerConceptDescription(createConceptDescription('concept-description-1'));
        db.registerConceptDescription(createConceptDescription('concept-description-2'));
        expect(db.hasConceptDescription('concept-description-1')).toBe(true);
        expect(db.hasConceptDescription('unknown-concept-description')).toBe(false);
    });

    it('should clear all tracked shells and submodel registrations', () => {
        db.setShellChanged('shell-1', true);
        db.registerSubmodels([referenceTo('submodel-1')], 'shell-1');
        db.registerConceptDescription(createConceptDescription('concept-description-1'));

        db.clear();

        expect(db.hasShell('shell-1')).toBe(false);
        expect(db.isShellChanged('shell-1')).toBe(false);
        expect(db.getSubmodelShellIds('submodel-1')).toEqual([]);
        expect(db.hasConceptDescription('concept-description-1')).toBe(false);
    });
});

function referenceTo(value: string): aas.Reference {
    return {
        type: 'ModelReference',
        keys: [
            {
                type: 'Submodel',
                value,
            },
        ],
    } satisfies aas.Reference;
}

function referenceWithoutKeys(): aas.Reference {
    return {
        type: 'ModelReference',
        keys: [],
    } satisfies aas.Reference;
}

function createConceptDescription(id: string): aas.ConceptDescription {
    return {
        id,
        idShort: 'idShort',
        category: 'CONSTANT',
        description: [],
        isCaseOf: [],
        modelType: 'ConceptDescription',
    } satisfies aas.ConceptDescription;
}
