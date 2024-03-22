/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument } from 'common';

export interface DocumentSubmodelPair {
    document: AASDocument;
    submodel: aas.Submodel;
}

export interface SubmodelViewDescriptor {
    template?: string;
    submodels: SubmodelReference[];
}

export interface SubmodelReference {
    id: string;
    endpoint: string;
    idShort: string;
}

export interface SubmodelTemplate {
    submodels: DocumentSubmodelPair[] | null;
}

export const CustomerFeedback = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback';

export const ZVEINameplate = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';

export const FHGNameplate = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';

export const supportedSubmodelTemplates = new Map<string, string>([
    [ZVEINameplate, 'Nameplate'],
    [CustomerFeedback, 'CustomerFeedback'],
]);

const semanticIdMap = new Map<string, string>([
    ['https://www.hsu-hh.de/aut/aas/nameplate', ZVEINameplate],
    [ZVEINameplate, ZVEINameplate],
    ['urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate', ZVEINameplate],
    ['https://admin-shell.io/zvei/nameplate/2/0/Nameplate', ZVEINameplate],
    [CustomerFeedback, CustomerFeedback],
]);

export function resolveSemanticId(value: aas.HasSemantics | aas.Reference | string): string | undefined {
    let semanticId: string | undefined;
    if (value) {
        if (typeof value === 'string') {
            semanticId = semanticIdMap.get(value);
        } else if (isReference(value)) {
            if (value.keys.length > 0) {
                semanticId = semanticIdMap.get(value.keys[0].value);
            }
        } else {
            if (value.semanticId?.keys != null && value.semanticId.keys.length > 0) {
                semanticId = semanticIdMap.get(value.semanticId.keys[0].value);
            }
        }
    }

    return semanticId;

    function isReference(value: unknown): value is aas.Reference {
        return Array.isArray((value as aas.Reference).keys);
    }
}
