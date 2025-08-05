/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as aas from './aas.js';
import { AASDocument, AASAbbreviation } from './types.js';

const DataSpecificationIEC61360 = 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360';

/** Represents a difference. */
export interface DifferenceItem {
    type: 'deleted' | 'inserted' | 'changed' | 'moved';
    sourceParent?: aas.Referable;
    sourceElement?: aas.Referable;
    sourceIndex?: number;
    destinationParent?: aas.Referable;
    destinationElement?: aas.Referable;
    destinationIndex?: number;
}

/**
 * Determines whether the specified referable represents an `AssetAdministrationShell`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `AssetAdministrationShell`; otherwise, `false`.
 */
export function isAssetAdministrationShell(referable: unknown): referable is aas.AssetAdministrationShell {
    return (referable as aas.Referable)?.modelType === 'AssetAdministrationShell';
}

/**
 * Determines whether the specified referable represents a `Submodel`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `Submodel`; otherwise, `false`.
 */
export function isSubmodel(referable: unknown): referable is aas.Submodel {
    return (referable as aas.Referable)?.modelType === 'Submodel';
}

/**
 * Determines whether the specified referable represents a `Property`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `Property`; otherwise, `false`.
 */
export function isProperty(referable: unknown): referable is aas.Property {
    return (referable as aas.Referable)?.modelType === 'Property';
}

/**
 * Determines whether the specified referable represents a `File`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `File`; otherwise, `false`.
 */
export function isFile(referable: unknown): referable is aas.File {
    return (referable as aas.Referable)?.modelType === 'File';
}

/**
 * Determines whether the specified referable represents a `Blob`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `Blob`; otherwise, `false`.
 */
export function isBlob(referable: unknown): referable is aas.Blob {
    return (referable as aas.Referable)?.modelType === 'Blob';
}

/**
 * Determines whether the specified referable represents a `MultiLanguageProperty`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `MultiLanguageProperty`; otherwise, `false`.
 */
export function isMultiLanguageProperty(referable: unknown): referable is aas.MultiLanguageProperty {
    return (referable as aas.Referable)?.modelType === 'MultiLanguageProperty';
}

/**
 * Determines whether the specified referable represents a `ReferenceElement`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `ReferenceElement`; otherwise, `false`.
 */
export function isReferenceElement(referable: unknown): referable is aas.ReferenceElement {
    return (referable as aas.Referable)?.modelType === 'ReferenceElement';
}

/**
 * Determines whether the specified referable represents a `SubmodelElementCollection`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `SubmodelElementCollection`; otherwise, `false`.
 */
export function isSubmodelElementCollection(referable: unknown): referable is aas.SubmodelElementCollection {
    return (referable as aas.Referable)?.modelType === 'SubmodelElementCollection';
}

/**
 * Determines whether the specified referable represents a `SubmodelElementList`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `SubmodelElementList`; otherwise, `false`.
 */
export function isSubmodelElementList(referable: unknown): referable is aas.SubmodelElementList {
    return (referable as aas.Referable)?.modelType === 'SubmodelElementList';
}

/**
 * Determines whether the specified referable represents an `AnnotatedRelationshipElement`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `AnnotatedRelationshipElement`; otherwise, `false`.
 */
export function isAnnotatedRelationshipElement(referable: unknown): referable is aas.AnnotatedRelationshipElement {
    return (referable as aas.AnnotatedRelationshipElement)?.modelType === 'AnnotatedRelationshipElement';
}

/**
 * Determines whether the specified referable represents a `RelationshipElement`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `RelationshipElement`; otherwise, `false`.
 */
export function isRelationshipElement(referable: unknown): referable is aas.RelationshipElement {
    return (referable as aas.Referable)?.modelType === 'RelationshipElement';
}

/**
 * Determines whether the specified referable represents an 'Entity'.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `Entity`; otherwise, `false`.
 */
export function isEntity(referable: unknown): referable is aas.Entity {
    return (referable as aas.Referable)?.modelType === 'Entity';
}

/**
 * Determines whether the specified referable represents an `Operation`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents an `Operation`; otherwise, `false`.
 */
export function isOperation(referable: unknown): referable is aas.Operation {
    return (referable as aas.Referable)?.modelType === 'Operation';
}

/**
 * Determines whether the specified referable represents a `Range`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `Range`; otherwise, `false`.
 */
export function isRange(referable: unknown): referable is aas.Range {
    return (referable as aas.Referable)?.modelType === 'Range';
}

/**
 * Determines whether the specified referable represents a `ConceptDescription`.
 * @param referable The current referable.
 * @returns `true` if the specified referable represents a `ConceptDescription`; otherwise, `false`.
 */
export function isConceptDescription(referable: unknown): referable is aas.ConceptDescription {
    return (referable as aas.Referable)?.modelType === 'ConceptDescription';
}

/**
 * Determines whether the specified value is of type `Referable`.
 * @param value The current value.
 * @returns `true` if the specified value is of type `Referable`; otherwise, `false`.
 */
export function isReferable(value: unknown): value is aas.Referable {
    const referable = value as aas.Referable;
    return typeof referable.modelType === 'string' && typeof referable.idShort === 'string';
}

/**
 * Determines whether the specified value is of type `Reference`.
 * @param value The current value.
 * @returns `true` if the specified value is of type `Reference`; otherwise, `false`.
 */
export function isReference(value: unknown): value is aas.Reference {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return typeof (value as aas.Reference).type === 'string' && Array.isArray((value as aas.Reference).keys);
}

/**
 * Determines whether the specified value represents a submodel element.
 * @param value The current value.
 * @returns `true` if the specified value represents a submodel element; otherwise, `false`.
 */
export function isSubmodelElement(value: unknown): value is aas.SubmodelElement {
    switch ((value as aas.Referable)?.modelType) {
        case 'AnnotatedRelationshipElement':
        case 'BasicEventElement':
        case 'Blob':
        case 'Capability':
        case 'Entity':
        case 'File':
        case 'MultiLanguageProperty':
        case 'Operation':
        case 'Property':
        case 'Range':
        case 'ReferenceElement':
        case 'RelationshipElement':
        case 'SubmodelElementCollection':
        case 'SubmodelElementList':
            return true;
        default:
            return false;
    }

    return false;
}

/** Indicates whether the specified value if of type `Environment`. */
export function isEnvironment(value: unknown): value is aas.Environment {
    return (
        Array.isArray((value as aas.Environment).assetAdministrationShells) &&
        Array.isArray((value as aas.Environment).submodels) &&
        Array.isArray((value as aas.Environment).conceptDescriptions)
    );
}

/**
 * Indicates whether the specified referable if of type Identifiable.
 * @param referable The referable.
 * @returns `true` if the specified referable is of type Identifiable.
 */
export function isIdentifiable(referable: aas.Referable | undefined | null): referable is aas.Identifiable {
    switch (referable?.modelType) {
        case 'AssetAdministrationShell':
        case 'Submodel':
        case 'ConceptDescription':
            return true;
        default:
            return false;
    }
}

/**
 * Indicates whether the specified referable if of type `DataElement`.
 * @param referable The referable.
 * @returns `true` if the specified referable is of type `DataElement`.
 */
export function isDataElement(referable: aas.Referable | undefined): referable is aas.DataElement {
    switch (referable?.modelType) {
        case 'Blob':
        case 'File':
        case 'MultiLanguageProperty':
        case 'Property':
        case 'Range':
        case 'ReferenceElement':
            return true;
        default:
            return false;
    }
}

/**
 * Determines whether the specified documents are equal.
 * @param a The first document.
 * @param b The second document.
 * @returns `true` if the specified documents are equal.
 */
export function equalDocument(a: AASDocument | null, b: AASDocument | null): boolean {
    return a === b || (a != null && b != null && a.id === b.id && a.endpoint === b.endpoint);
}

/**
 * Gets the parent of the specified element.
 * @param env The Asset Administration Shell environment.
 * @param referable The element to check.
 * @returns The parent element or `undefined` if element is the root.
 */
export function getParent(env: aas.Environment, referable: aas.Referable): aas.Referable | undefined {
    return referable.parent ? selectReferable(env, referable.parent) : undefined;
}

/**
 * Determines the submodel to which the specified  referable belongs.
 * @param env The AAS environment.
 * @param referable An element of the AAS.
 * @returns The submodel or `undefined`.
 */
export function selectSubmodel(env: aas.Environment, referable: aas.Referable): aas.Submodel | undefined {
    if (isSubmodel(referable)) {
        return referable as aas.Submodel;
    }

    if (env.submodels && referable.parent && referable.parent.keys[0].type === 'Submodel') {
        const id = referable.parent.keys[0].value;
        return env.submodels.find(item => item.id === id);
    }

    return undefined;
}

/**
 * Determines wether the specified element is a descendant of the given ancestor.
 * @param env The AAS environment.
 * @param ancestor An ancestor element.
 * @param element An element to check.
 * @returns `true` if the element is a descendant of the given ancestor; otherwise, `false`.
 */
export function isDescendant(env: aas.Environment, ancestor: aas.Referable, element: aas.Referable): boolean {
    for (let referable = getParent(env, element); referable; referable = getParent(env, referable)) {
        if (referable === ancestor) {
            return true;
        }
    }

    return false;
}

/**
 * Flattens the specified element and all its descendants.
 * @param root The root element.
 * @returns All descendants of the specified element and the element itself.
 */
export function flat(root: aas.Referable): aas.Referable[] {
    const stack: aas.Referable[][] = [];
    const result: aas.Referable[] = [];
    result.push(root);
    let children = getChildren(root);
    if (children.length > 0) {
        stack.push(children);
    }

    while (stack.length) {
        stack.pop()!.forEach(child => {
            result.push(child);
            children = getChildren(child);
            if (children.length > 0) {
                stack.push(children);
            }
        });
    }

    return result;
}

/**
 * Traverses over all descendants of the specified root element and the root element itself.
 * @param root The root element.
 * @returns An iterator.
 */
export function* traverse(root: aas.Referable): Generator<aas.Referable> {
    const stack: aas.Referable[][] = [];
    yield root;

    let children = getChildren(root);
    if (children.length > 0) {
        stack.push(children);
    }

    while (stack.length) {
        for (const child of stack.pop()!) {
            yield child;

            children = getChildren(child);
            if (children.length > 0) {
                stack.push(children);
            }
        }
    }
}

/**
 * Removes the specified element form the given parent.
 * @param parent The parent.
 * @param child The element to be removed.
 */
export function remove(parent: aas.Referable, child: aas.Referable): void {
    const children = getChildren(parent);
    const index = children.indexOf(child);
    if (index >= 0) {
        children.splice(index, 1);
    }
}

/**
 * Gets the abbreviation for the specified AAS model type.
 * @param modelType The AAS model type.
 * @returns The corresponding abbreviation.
 */
export function getAbbreviation(modelType: aas.ModelType): AASAbbreviation | undefined {
    switch (modelType) {
        case 'AnnotatedRelationshipElement':
            return 'RelA';
        case 'AssetAdministrationShell':
            return 'AAS';
        case 'BasicEventElement':
            return 'Evt';
        case 'Capability':
            return 'Cap';
        case 'ConceptDescription':
            return 'CD';
        case 'Property':
            return 'Prop';
        case 'MultiLanguageProperty':
            return 'MLP';
        case 'Range':
            return 'Range';
        case 'Entity':
            return 'Ent';
        case 'File':
            return 'File';
        case 'Blob':
            return 'Blob';
        case 'Operation':
            return 'Opr';
        case 'ReferenceElement':
            return 'Ref';
        case 'RelationshipElement':
            return 'Rel';
        case 'Submodel':
            return 'SM';
        case 'SubmodelElementCollection':
            return 'SMC';
        case 'SubmodelElementList':
            return 'SML';
        default:
            return undefined;
    }
}

/**
 * Gets the model type that corresponds to the specified abbreviation.
 * @param abbreviation The abbreviation.
 */
export function getModelTypeFromAbbreviation(abbreviation: AASAbbreviation): aas.ModelType | undefined {
    switch (abbreviation.toLowerCase()) {
        case 'aas':
            return 'AssetAdministrationShell';
        case 'blob':
            return 'Blob';
        case 'cap':
            return 'Capability';
        case 'cd':
            return 'ConceptDescription';
        case 'ent':
            return 'Entity';
        case 'evt':
            return 'BasicEventElement';
        case 'file':
            return 'File';
        case 'mlp':
            return 'MultiLanguageProperty';
        case 'opr':
            return 'Operation';
        case 'prop':
            return 'Property';
        case 'range':
            return 'Range';
        case 'ref':
            return 'ReferenceElement';
        case 'rel':
            return 'RelationshipElement';
        case 'rela':
            return 'AnnotatedRelationshipElement';
        case 'sm':
            return 'Submodel';
        case 'smc':
            return 'SubmodelElementCollection';
        case 'sml':
            return 'SubmodelElementList';
        default:
            return undefined;
    }
}

/**
 * Selects the referable that belongs to the specified reference.
 * @param env The AAS environment.
 * @param reference The reference.
 * @returns The referenced referable or `undefined`.
 */
export function selectReferable<T extends aas.Referable>(
    env: aas.Environment,
    reference: aas.Reference,
): T | undefined {
    let referable: aas.Referable | undefined;
    for (const key of reference.keys) {
        switch (key.type) {
            case 'AssetAdministrationShell':
                referable = env.assetAdministrationShells.find(item => item.id === key.value);
                break;
            case 'ConceptDescription':
                referable = env.conceptDescriptions.find(item => item.id === key.value);
                break;
            case 'Submodel':
                referable = env.submodels.find(item => item.id === key.value);
                break;
            default:
                referable = referable && getChildren(referable).find(item => item.idShort === key.value);
                break;
        }

        if (!referable) {
            break;
        }
    }

    return referable as T;
}

/**
 * Selects the referable with the specified path in the given AAS environment.
 * @param env The Asset Administration Shell environment.
 * @param submodel The name (idShort or identifier) of the submodel.
 * @param idShortPath The path to the submodel element.
 * @returns The `Referable` at the specified path.
 */
export function selectElement<T extends aas.Referable>(
    env: aas.Environment,
    submodel: string,
    idShortPath?: string,
): T | undefined {
    const sm = env.submodels.find(sm => sm.idShort === submodel || sm.id === submodel);
    if (!sm) {
        return undefined;
    }

    if (!idShortPath) {
        return sm as unknown as T;
    }

    return getReferable(sm, idShortPath);
}

/**
 * Gets the semantic identifier of the specified AAS element.
 * @param value The AAS element.
 * @returns The semantic identifier or `undefined`.
 */
export function getSemanticId(value: aas.Referable): string | undefined {
    return (value as aas.HasSemantics)?.semanticId?.keys.at(0)?.value;
}

/**
 * Gets the data specification content of the specified referable.
 * @param env The AAS environment.
 * @param referable The current referable.
 * @returns The data specification content of the specified referable or `undefined`.
 */
export function getIEC61360Content(
    env: aas.Environment,
    referable: aas.Referable,
): aas.DataSpecificationIec61360 | undefined {
    const hasDataSpecification = referable as aas.HasDataSpecification;
    if (hasDataSpecification.embeddedDataSpecifications) {
        for (const item of hasDataSpecification.embeddedDataSpecifications) {
            if (getPath(item.dataSpecification).startsWith(DataSpecificationIEC61360)) {
                return item.dataSpecificationContent as aas.DataSpecificationIec61360;
            }
        }
    } else {
        const semanticId = getSemanticId(referable);
        if (semanticId) {
            const conceptDescription = getConceptDescription(env, semanticId);
            if (conceptDescription) {
                return getIEC61360Content(env, conceptDescription);
            }
        }
    }

    return undefined;
}

/**
 * Gets the unit.
 * @param env The AAS environment.
 * @param referable The current referable.
 * @returns The unit of the specified referable.
 */
export function getUnit(env: aas.Environment, referable: aas.Referable): string | undefined {
    return getIEC61360Content(env, referable)?.unit;
}

/**
 * Gets the preferred name of the specified referable.
 * @param env The AAS environment.
 * @param referable The current referable.
 * @returns The preferred name of the specified referable.
 */
export function getPreferredName(env: aas.Environment, referable: aas.Referable): aas.LangString[] | undefined {
    return getIEC61360Content(env, referable)?.preferredName;
}

/**
 * Returns the children of the specified parent.
 * @param parent The current referable.
 * @param env The Asset Administration Shell environment.
 * @returns The children of the current parent.
 */
export function getChildren(parent: aas.Referable, env?: aas.Environment): aas.Referable[] {
    if (parent) {
        switch (parent.modelType) {
            case 'SubmodelElementCollection':
                return (parent as aas.SubmodelElementCollection).value ?? [];
            case 'SubmodelElementList':
                return (parent as aas.SubmodelElementList).value ?? [];
            case 'Submodel':
                return (parent as aas.Submodel).submodelElements ?? [];
            case 'AssetAdministrationShell':
                return env?.submodels ?? [];
            case 'Entity':
                return (parent as aas.Entity).statements ?? [];
            case 'AnnotatedRelationshipElement':
                return (parent as aas.AnnotatedRelationshipElement).annotations ?? [];
            case 'Operation':
                return [
                    ...((parent as aas.Operation).inputVariables?.map(variable => variable.value) ?? []),
                    ...((parent as aas.Operation).inoutputVariables?.map(variable => variable.value) ?? []),
                    ...((parent as aas.Operation).outputVariables?.map(variable => variable.value) ?? []),
                ];
        }
    }

    return [];
}

/**
 * Returns the absolute path of the specified referable. The path starts with identifier of the Submodel
 * followed by the names (idShort) up to the specified referable.
 * @param referable The referable that is a descendant of a submodel.
 * @returns An array where the first element is the identifier of the submodel.
 */
export function getAbsolutePath(referable: aas.Referable): string[] {
    if (!referable.parent) {
        throw new Error('Argument undefined.');
    }

    const path = referable.parent.keys.map(key => key.value);
    path.push(referable.idShort);
    return path;
}

/**
 * Gets the idShort path of the specified
 * @param referable The current referable.
 * @returns The idShort path of the specified referable.
 */
export function getIdShortPath(referable: aas.Referable): string {
    if (!referable.parent) {
        throw new Error('Invalid operation');
    }

    let idShortPath = '';
    const keys = referable.parent.keys;
    for (let i = 1, n = keys.length; i < n; i++) {
        idShortPath += keys[i].value + '.';
    }

    idShortPath += referable.idShort;
    return idShortPath;
}

/**
 * Gets the path of the specified reference.
 * @param reference The current reference.
 * @returns A path that represents the specified reference.
 */
export function getPath(reference: aas.Reference): string {
    return reference.keys.map(key => key.value).join('.');
}

/**
 * Compares two AAS references for equality.
 * @param a The first reference.
 * @param b The second reference.
 * @returns `true` if both references are equal; otherwise, `false`.
 */
export function equalReference(a?: aas.Reference, b?: aas.Reference): boolean {
    if (a === b) {
        return true;
    }

    if (!a || !b) {
        return false;
    }

    if (
        a.keys.length === b.keys.length &&
        a.type === b.type &&
        equalReference(a.referredSemanticId, b.referredSemanticId)
    ) {
        for (let i = 0; i < a.keys.length; i++) {
            if (a.keys[i].type !== b.keys[i].type || a.keys[i].value === b.keys[i].value) {
                return false;
            }
        }

        return true;
    }

    return false;
}

/**
 * Gets the referable that is a descendant of the specified submodel.
 * @param element The current submodel or submodel element.
 * @param idShortPath The idShort path of the referable.
 * @returns The corresponding referable or `undefined`.
 */
export function getReferable<T extends aas.Referable>(
    element: aas.Submodel | aas.SubmodelElement,
    idShortPath: string,
): T | undefined {
    let referable: aas.Referable | undefined = element;
    for (const idShort of idShortPath.split('.')) {
        const children = getChildren(referable);
        referable = children.find(child => child.idShort === idShort);
        if (referable === undefined) {
            return undefined;
        }
    }

    return referable as T;
}

/**
 * Gets the concept description with the specified identifier from the given AAS environment.
 * @param env The AAS environment.
 * @param id The identifier of the concept description to get.
 * @returns The concept description or `undefined`.
 */
export function getConceptDescription(env: aas.Environment, id: string): aas.ConceptDescription | undefined {
    return env.conceptDescriptions.find(item => item.id === id);
}
