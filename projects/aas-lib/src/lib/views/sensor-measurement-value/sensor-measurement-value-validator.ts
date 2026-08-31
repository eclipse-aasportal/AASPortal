/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, getChildren, getSemanticId, isProperty, isRange, isSubmodelElementCollection } from 'aas-core';

import { SENSOR_MEASUREMENT_VALUE_1_0 } from '../views-constants';

export { SENSOR_MEASUREMENT_VALUE_1_0 };

type ElementType = 'Property' | 'Range' | 'SubmodelElementCollection';

type ElementDefinition = {
    path: string;
    modelType: ElementType;
    semanticId: string;
    valueType?: aas.DataTypeDefXsd;
    required: boolean;
};

const definitions: ElementDefinition[] = [
    {
        path: 'MeasuredValue',
        modelType: 'SubmodelElementCollection',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/measuredvalue/1/0',
        required: true,
    },
    {
        path: 'MeasuredValue.Value',
        modelType: 'Property',
        valueType: 'xs:float',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/value/1/0',
        required: true,
    },
    {
        path: 'MeasuredValue.Unit',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: '0112/2///62720#UBA000',
        required: true,
    },
    {
        path: 'MeasuredValue.Kind',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: '0112/2///62683#ACI144',
        required: true,
    },
    {
        path: 'MeasuredValuePreDefined',
        modelType: 'SubmodelElementCollection',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/measuredvaluepredefined/1/0',
        required: false,
    },
    {
        path: 'MeasuredValuePreDefined.Distance',
        modelType: 'Property',
        valueType: 'xs:float',
        semanticId: '0112/2///61987#ABN718#001',
        required: true,
    },
    {
        path: 'MeasurementTimestamp',
        modelType: 'Property',
        valueType: 'xs:dateTime',
        semanticId: '0112/2///61360_7#CBA007',
        required: true,
    },
    {
        path: 'Concept',
        modelType: 'SubmodelElementCollection',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/concept/1/0',
        required: false,
    },
    {
        path: 'Concept.Origin',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/origin/1/0',
        required: false,
    },
    {
        path: 'Concept.Version',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/version/1/0',
        required: false,
    },
    {
        path: 'Concept.Identifier',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/identifier/1/0',
        required: false,
    },
    {
        path: 'MeasurementQualifier',
        modelType: 'SubmodelElementCollection',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/measurementqualifier/1/0',
        required: true,
    },
    {
        path: 'MeasurementQualifier.Quality',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: '0112/2///61360_7#CBA006',
        required: true,
    },
    {
        path: 'MeasurementQualifier.Range',
        modelType: 'Range',
        valueType: 'xs:float',
        semanticId: 'https://admin-shell.io/idta/meaurementvalue/range/1/0',
        required: false,
    },
    {
        path: 'MeasurementQualifier.Scale',
        modelType: 'Property',
        valueType: 'xs:integer',
        semanticId: 'https://admin-shell.io/idta/measurementvalue/scale/1/0',
        required: false,
    },
    {
        path: 'MeasurementQualifier.Tag',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: '0112/2///61987#ABB271',
        required: false,
    },
];

export interface MeasurementValueData {
    value: string | undefined;
    valueProperty: aas.Property;
    unit: string | undefined;
    kind: string | undefined;
    timestamp: string | undefined;
    predefinedValue?: string;
    quality: string | undefined;
    range?: string;
    scale?: string;
    tag?: string;
    origin?: string;
    version?: string;
    identifier?: string;
    extensions: aas.Referable[];
}

export type MeasurementValueValidation =
    { valid: true; data: MeasurementValueData } | { valid: false; errors: string[] };

/** Validates and normalizes an IDTA 02029-1 Measurement Value submodel. */
export function validateSensorMeasurementValue(submodel: aas.Submodel | undefined): MeasurementValueValidation {
    const errors: string[] = [];
    if (!submodel) {
        return { valid: false, errors: ['Submodel is missing.'] };
    }

    if (getSemanticId(submodel) !== SENSOR_MEASUREMENT_VALUE_1_0) {
        errors.push('Submodel semantic ID does not match IDTA 02029-1 v1.0.');
    }

    const elements = new Map<string, aas.Referable>();
    for (const definition of definitions) {
        const element = findSingle(submodel, definition.path, errors);
        if (!element) {
            if (definition.required && hasOptionalParent(definition.path, elements)) {
                errors.push(`${definition.path} is required when its collection is present.`);
            } else if (definition.required && !hasOptionalAncestor(definition.path)) {
                errors.push(`${definition.path} is required.`);
            }
            continue;
        }

        elements.set(definition.path, element);
        if (element.modelType !== definition.modelType) {
            errors.push(`${definition.path} must be a ${definition.modelType}.`);
            continue;
        }
        if (getSemanticId(element) !== definition.semanticId) {
            errors.push(`${definition.path} has an unexpected semantic ID.`);
        }
        if (definition.valueType && (element as aas.Property | aas.Range).valueType !== definition.valueType) {
            errors.push(`${definition.path} must use ${definition.valueType}.`);
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    const valueProperty = elements.get('MeasuredValue.Value') as aas.Property;
    const range = elements.get('MeasurementQualifier.Range');
    return {
        valid: true,
        data: {
            value: valueProperty.value,
            valueProperty,
            unit: propertyValue(elements, 'MeasuredValue.Unit'),
            kind: propertyValue(elements, 'MeasuredValue.Kind'),
            timestamp: propertyValue(elements, 'MeasurementTimestamp'),
            predefinedValue: propertyValue(elements, 'MeasuredValuePreDefined.Distance'),
            quality: propertyValue(elements, 'MeasurementQualifier.Quality'),
            range: isRange(range)
                ? [range.min, range.max].filter(value => value !== undefined).join(' – ') || undefined
                : undefined,
            scale: propertyValue(elements, 'MeasurementQualifier.Scale'),
            tag: propertyValue(elements, 'MeasurementQualifier.Tag'),
            origin: propertyValue(elements, 'Concept.Origin'),
            version: propertyValue(elements, 'Concept.Version'),
            identifier: propertyValue(elements, 'Concept.Identifier'),
            extensions: getExtensions(submodel),
        },
    };
}

function findSingle(parent: aas.Referable, path: string, errors: string[]): aas.Referable | undefined {
    let current = parent;
    for (const idShort of path.split('.')) {
        const matches = getChildren(current).filter(child => child.idShort === idShort);
        if (matches.length > 1) {
            errors.push(`${path} occurs more than once.`);
            return undefined;
        }
        if (matches.length === 0) {
            return undefined;
        }
        current = matches[0];
    }
    return current;
}

function hasOptionalAncestor(path: string): boolean {
    const parent = path.split('.').slice(0, -1).join('.');
    return definitions.some(definition => definition.path === parent && !definition.required);
}

function hasOptionalParent(path: string, elements: Map<string, aas.Referable>): boolean {
    const parent = path.split('.').slice(0, -1).join('.');
    return Boolean(parent && elements.has(parent));
}

function propertyValue(elements: Map<string, aas.Referable>, path: string): string | undefined {
    const element = elements.get(path);
    return isProperty(element) ? element.value : undefined;
}

function getExtensions(submodel: aas.Submodel): aas.Referable[] {
    const knownPaths = new Set(definitions.map(definition => definition.path));
    const extensions: aas.Referable[] = [];
    collect(submodel, '');
    return extensions;

    function collect(parent: aas.Referable, prefix: string): void {
        for (const child of getChildren(parent)) {
            const path = prefix ? `${prefix}.${child.idShort}` : child.idShort;
            if (!knownPaths.has(path)) {
                extensions.push(child);
                continue;
            }
            if (isSubmodelElementCollection(child)) {
                collect(child, path);
            }
        }
    }
}
