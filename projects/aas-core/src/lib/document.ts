/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isEqual from 'lodash-es/isEqual.js';
import * as aas from './aas.js';
import { AASDocument, AASAbbreviation } from './types.js';
import { isHasSemantics } from './index.js';

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
 * Goes up the hierarchy to the submodel.
 * @param env The AAS environment.
 * @param referable An element of the AAS.
 * @returns The submodel or `undefined`.
 */
export function selectSubmodel(env: aas.Environment, referable: aas.Referable): aas.Submodel | undefined {
    if (referable.modelType === 'Submodel') {
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
 * @param root The root element.
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
 * Removes equal elements or descendants of an element.
 * @param aas The root element.
 * @param elements The elements to normalize.
 * @returns An array of elements.
 */
export function normalize<T>(
    env: aas.Environment,
    elements: T[],
    access: (item: T) => aas.Referable = item => item as aas.Referable,
): T[] {
    let items: T[] = elements;
    let temp: T[] = [];
    for (let i = 0; i < items.length; ++i) {
        for (let j = 0; j < items.length; j++) {
            if (i !== j) {
                if (items[i] !== items[j] && !isDescendant(env, access(items[i]), access(items[j]))) {
                    temp.push(items[j]);
                }
            } else {
                temp.push(items[i]);
            }
        }

        items = temp;
        temp = [];
    }

    return items;
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
 * Determines the differences between the specified source and destination referable.
 * @param sourceEnv The source element.
 * @param targetEnv The destination element.
 * @returns The differences between the source and destination element.
 */
export function diff(sourceEnv: aas.Environment, targetEnv: aas.Environment): DifferenceItem[] {
    if (sourceEnv && targetEnv && sourceEnv === targetEnv) {
        return [];
    }

    return [
        ...diffCollection(sourceEnv.assetAdministrationShells, targetEnv.assetAdministrationShells),
        ...diffCollection(sourceEnv.submodels, targetEnv.submodels),
        ...diffCollection(sourceEnv.conceptDescriptions, targetEnv.conceptDescriptions),
    ];

    function diffCollection(sources: aas.Referable[], targets: aas.Referable[]): DifferenceItem[] {
        const diffs: DifferenceItem[] = [];
        for (let i = 0; i < sources.length; i++) {
            const j = targets.findIndex(item => item.idShort === sources[i].idShort);
            if (j < 0) {
                diffs.push({ type: 'inserted', sourceIndex: i, sourceElement: sources[i] });
            } else {
                diffs.push(...diffReferable(sources[i], targets[j]));
            }
        }

        for (let i = 0; i < targets.length; i++) {
            const j = sources.findIndex(item => item.idShort === targets[i].idShort);
            if (j < 0) {
                diffs.push({ type: 'deleted', destinationIndex: i, destinationElement: targets[i] });
            }
        }

        return diffs;
    }

    function diffReferable(source: aas.Referable, target: aas.Referable): DifferenceItem[] {
        const sourceMap = new Map<string, [aas.Referable | undefined, aas.Referable]>(traverse(source));
        const destinationMap = new Map<string, [aas.Referable | undefined, aas.Referable]>(traverse(target));
        let deleted: DifferenceItem[] = [];
        let inserted: DifferenceItem[] = [];
        const changed: DifferenceItem[] = [];
        const moved: DifferenceItem[] = [];

        for (const destinationItem of destinationMap) {
            const sourceTuple = sourceMap.get(destinationItem[0]);
            if (sourceTuple) {
                const src = sourceTuple[1];
                const srcParent = sourceTuple[0];
                const dst = destinationItem[1][1];
                const dstParent = destinationItem[1][0];
                if (!isEqualReferable(src, dst)) {
                    changed.push({
                        type: 'changed',
                        sourceParent: srcParent,
                        sourceElement: src,
                        sourceIndex: indexOf(srcParent, src),
                        destinationParent: dstParent,
                        destinationElement: dst,
                        destinationIndex: indexOf(dstParent, dst),
                    });
                } else {
                    const i = indexOf(srcParent, src);
                    const j = indexOf(dstParent, dst);
                    if (twins(srcParent, dstParent) && i !== j) {
                        moved.push({
                            type: 'moved',
                            sourceParent: srcParent,
                            sourceElement: src,
                            sourceIndex: i,
                            destinationParent: dstParent,
                            destinationElement: dst,
                            destinationIndex: j,
                        });
                    }
                }
            } else {
                deleted.push({
                    type: 'deleted',
                    sourceParent: getParent(targetEnv, destinationItem[1][1]),
                    destinationParent: destinationItem[1][0],
                    destinationElement: destinationItem[1][1],
                    destinationIndex: indexOf(destinationItem[1][0], destinationItem[1][1]),
                });
            }
        }

        for (const item of sourceMap) {
            if (!destinationMap.has(item[0])) {
                inserted.push({
                    type: 'inserted',
                    sourceParent: item[1][0],
                    sourceElement: item[1][1],
                    sourceIndex: indexOf(item[1][0], item[1][1]),
                    destinationParent: getParent(targetEnv, item[1][1]),
                });
            }
        }

        deleted = normalize(targetEnv, deleted, item => item.destinationElement as aas.Referable);
        inserted = normalize(sourceEnv, inserted, item => item.sourceElement as aas.Referable);

        return [...deleted, ...inserted, ...moved, ...changed];
    }

    function* traverse(root: aas.Referable): Generator<[string, [aas.Referable | undefined, aas.Referable]]> {
        yield ['/', [undefined, root]];

        for (const item of traverseChildren(root, '/' + root.idShort)) {
            yield item;
        }

        function* traverseChildren(
            parent: aas.Referable,
            path: string,
        ): Generator<[string, [aas.Referable, aas.Referable]]> {
            for (const child of getChildren(parent)) {
                const childPath = path + child.idShort;
                yield [path + child.idShort, [parent, child]];

                for (const item of traverseChildren(child, childPath)) {
                    yield item;
                }
            }
        }
    }

    function twins(a?: aas.Referable, b?: aas.Referable): boolean {
        return a && b ? a === b || (equalReference(a.parent, b.parent) && a.idShort === b.idShort) : false;
    }

    function indexOf(parent: aas.Referable | undefined, child: aas.Referable): number {
        return parent ? getChildren(parent).indexOf(child) : -1;
    }

    function isEqualReferable(a: aas.Referable, b: aas.Referable): boolean {
        let equal = false;
        if (a === b) {
            equal = true;
        } else if (a.modelType === b.modelType) {
            if (a.modelType === 'SubmodelElementCollection') {
                equal = isEqual(
                    { ...a, value: undefined } as aas.SubmodelElementCollection,
                    { ...b, value: undefined } as aas.SubmodelElementCollection,
                );
            } else if (a.modelType === 'SubmodelElementList') {
                equal = isEqual(
                    { ...a, value: undefined } as aas.SubmodelElementList,
                    { ...b, value: undefined } as aas.SubmodelElementList,
                );
            } else if (a.modelType === 'Submodel') {
                equal = isEqual(
                    { ...a, submodelElements: undefined } as aas.Submodel,
                    { ...b, submodelElements: undefined } as aas.Submodel,
                );
            } else if (a.modelType === 'AssetAdministrationShell') {
                equal = isEqual(
                    { ...a, submodels: undefined } as aas.AssetAdministrationShell,
                    { ...b, submodels: undefined } as aas.AssetAdministrationShell,
                );
            } else {
                equal = isEqual(a, b);
            }
        }

        return equal;
    }
}

/**
 * Determines the differences between the specified source and destination AAS Element.
 * @param source The source element.
 * @param destination The destination element.
 * @returns The differences between the source and destination element.
 */
export function diffAsync(source: aas.Environment, destination: aas.Environment): Promise<DifferenceItem[]> {
    return new Promise<DifferenceItem[]>((result, reject) => {
        try {
            result(diff(source, destination));
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Compares two trees for equality.
 * @param a The root element of the first tree.
 * @param b The root element of the second tree.
 * @returns `true` if both trees are equal; otherwise, `false`.
 */
export function isDeepEqual(a?: aas.Environment, b?: aas.Environment): boolean {
    const queue: [aas.Referable, aas.Referable][] = [];
    if (a && b) {
        if (
            !equalLength(a.assetAdministrationShells, b.assetAdministrationShells) ||
            !equalLength(a.submodels, b.submodels) ||
            !equalLength(a.conceptDescriptions, b.conceptDescriptions)
        ) {
            return false;
        }

        if (
            !queueReferables(a.assetAdministrationShells, b.assetAdministrationShells) ||
            !queueReferables(a.submodels, b.submodels) ||
            !queueReferables(a.conceptDescriptions, b.conceptDescriptions)
        ) {
            return false;
        }

        while (queue.length > 0) {
            const pair = queue.pop();
            if (!pair || !equal(pair[0], pair[1])) {
                return false;
            }
        }
    }

    return true;

    function equalLength<T>(a?: T[], b?: T[]): boolean {
        return a != null && b != null && a.length === b.length;
    }

    function queueReferables(a?: aas.Referable[], b?: aas.Referable[]): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.length === b.length) {
            for (let i = 0, n = a.length; i < n; i++) {
                queue.push([a[i], b[i]]);
            }

            return true;
        }

        return false;
    }

    function equal(a: aas.Referable, b: aas.Referable): boolean {
        switch (a.modelType) {
            case 'AssetAdministrationShell':
                return equalShell(a as aas.AssetAdministrationShell, b as aas.AssetAdministrationShell);
            case 'AnnotatedRelationshipElement':
                return equalAnnotatedRelationshipElement(
                    a as aas.AnnotatedRelationshipElement,
                    b as aas.AnnotatedRelationshipElement,
                );
            case 'BasicEventElement':
                return equalBasicEventElement(a as aas.BasicEventElement, b as aas.BasicEventElement);
            case 'Capability':
                return equalCapability(a as aas.Capability, b as aas.Capability);
            case 'Blob':
                return equalBlob(a as aas.Blob, b as aas.Blob);
            case 'ConceptDescription':
                return equalConceptDescription(a as aas.ConceptDescription, b as aas.ConceptDescription);
            case 'Entity':
                return equalEntity(a as aas.Entity, b as aas.Entity);
            case 'File':
                return equalFile(a as aas.File, b as aas.File);
            case 'MultiLanguageProperty':
                return equalMultiLanguageProperty(a as aas.MultiLanguageProperty, b as aas.MultiLanguageProperty);
            case 'Operation':
                return equalOperation(a as aas.Operation, b as aas.Operation);
            case 'Property':
                return equalProperty(a as aas.Property, b as aas.Property);
            case 'Range':
                return equalRange(a as aas.Range, b as aas.Range);
            case 'ReferenceElement':
                return equalReferenceElement(a as aas.ReferenceElement, b as aas.ReferenceElement);
            case 'RelationshipElement':
                return equalRelationshipElement(a as aas.RelationshipElement, b as aas.RelationshipElement);
            case 'Submodel':
                return equalSubmodel(a as aas.Submodel, b as aas.Submodel);
            case 'SubmodelElementCollection':
                return equalSubmodelElementCollection(
                    a as aas.SubmodelElementCollection,
                    b as aas.SubmodelElementCollection,
                );
            case 'SubmodelElementList':
                return equalSubmodelElementList(a as aas.SubmodelElementList, b as aas.SubmodelElementList);
            default:
                return true;
        }
    }

    function equalIdentifiable(a: aas.Identifiable, b: aas.Identifiable): boolean {
        return (
            equalReferable(a, b) && a.id === b.id && equalAdministrativeInformation(a.administration, b.administration)
        );
    }

    function equalAdministrativeInformation(
        a?: aas.AdministrativeInformation,
        b?: aas.AdministrativeInformation,
    ): boolean {
        if (a === b) {
            return true;
        }

        if (!a || !b) {
            return false;
        }

        return a.version === b.version && a.revision === b.revision;
    }

    function equalHasDataSpecification(a: aas.HasDataSpecification, b: aas.HasDataSpecification): boolean {
        return equalEmbeddedDataSpecifications(a.embeddedDataSpecifications, b.embeddedDataSpecifications);
    }

    function equalEmbeddedDataSpecifications(
        a?: aas.EmbeddedDataSpecification[],
        b?: aas.EmbeddedDataSpecification[],
    ): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.length === b.length) {
            for (let i = 0, n = a.length; i < n; i++) {
                if (!equalEmbeddedDataSpecification(a[i], b[i])) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    function equalEmbeddedDataSpecification(
        a: aas.EmbeddedDataSpecification,
        b: aas.EmbeddedDataSpecification,
    ): boolean {
        return (
            equalReference(a.dataSpecification, b.dataSpecification) &&
            equalDataSpecificationContent(a.dataSpecificationContent, b.dataSpecificationContent)
        );
    }

    function equalDataSpecificationContent(a: aas.DataSpecificationContent, b: aas.DataSpecificationContent): boolean {
        return isEqual(a, b);
    }

    function equalHasSemantics(a: aas.HasSemantics, b: aas.HasSemantics): boolean {
        return equalReference(a.semanticId, b.semanticId);
    }

    function equalQualifiable(a: aas.Qualifiable, b: aas.Qualifiable): boolean {
        return equalQualifiers(a.qualifiers, b.qualifiers);
    }

    function equalQualifiers(a?: aas.Qualifier[], b?: aas.Qualifier[]): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.length === b.length) {
            for (let i = 0, n = a.length; i < n; i++) {
                if (!equalQualifier(a[i], b[i])) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    function equalQualifier(a: aas.Qualifier, b: aas.Qualifier) {
        return (
            a.kind === b.kind &&
            a.type === b.type &&
            a.valueType === b.valueType &&
            a.value === b.value &&
            equalReference(a.valueId, b.valueId)
        );
    }

    function equalHasKind(a: aas.HasKind, b: aas.HasKind): boolean {
        return a.kind === b.kind;
    }

    function equalShell(a: aas.AssetAdministrationShell, b: aas.AssetAdministrationShell): boolean {
        if (!equalIdentifiable(a, b) || !equalHasDataSpecification(a, b)) {
            return false;
        }

        return (
            equalReferences(a.submodels, b.submodels) &&
            equalAssetInformation(a.assetInformation, b.assetInformation) &&
            equalReference(a.derivedFrom, b.derivedFrom)
        );
    }

    function equalAssetInformation(a: aas.AssetInformation, b: aas.AssetInformation): boolean {
        return (
            a.assetKind === b.assetKind &&
            a.globalAssetId === b.globalAssetId &&
            equalSpecificIds(a.specificAssetIds, b.specificAssetIds) &&
            equalResource(a.defaultThumbnail, b.defaultThumbnail)
        );
    }

    function equalSpecificIds(a?: aas.SpecificAssetId[], b?: aas.SpecificAssetId[]): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.length === b.length) {
            for (let i = 0, n = a.length; i < n; i++) {
                if (!equalSpecificAssetId(a[i], b[i])) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    function equalResource(a?: aas.Resource, b?: aas.Resource): boolean {
        return a === b || (a != null && b != null && a.contentType === b.contentType && a.path === b.path);
    }

    function equalSubmodel(a: aas.Submodel, b: aas.Submodel): boolean {
        return (
            equalIdentifiable(a, b) &&
            equalHasDataSpecification(a, b) &&
            equalHasSemantics(a, b) &&
            equalQualifiable(a, b) &&
            equalHasKind(a, b) &&
            queueReferables(a.submodelElements, b.submodelElements)
        );
    }

    function equalReferable(a: aas.Referable, b: aas.Referable): boolean {
        return (
            a.modelType === b.modelType &&
            a.idShort === b.idShort &&
            a.category === b.category &&
            equalLangStrings(a.description, b.description) &&
            equalReference(a.parent, b.parent)
        );
    }

    function equalSubmodelElement(a: aas.SubmodelElement, b: aas.SubmodelElement): boolean {
        return (
            equalReferable(a, b) && equalHasDataSpecification(a, b) && equalHasSemantics(a, b) && equalQualifiable(a, b)
        );
    }

    function equalProperty(a: aas.Property, b: aas.Property): boolean {
        if (!equalSubmodelElement(a, b)) {
            return false;
        }

        if (a.valueType !== b.valueType) {
            return false;
        }

        if (a.category === 'CONSTANT' || a.category === 'PARAMETER') {
            if (a.value !== b.value) {
                return false;
            }
        }

        return equalReference(a.valueId, b.valueId);
    }

    function equalMultiLanguageProperty(a: aas.MultiLanguageProperty, b: aas.MultiLanguageProperty): boolean {
        return equalSubmodelElement(a, b) && equalLangStrings(a.value, b.value);
    }

    function equalSubmodelElementCollection(
        a: aas.SubmodelElementCollection,
        b: aas.SubmodelElementCollection,
    ): boolean {
        return equalSubmodelElement(a, b) && queueReferables(a.value, b.value);
    }

    function equalSubmodelElementList(a: aas.SubmodelElementList, b: aas.SubmodelElementList): boolean {
        return (
            equalSubmodelElement(a, b) &&
            a.orderRelevant === b.orderRelevant &&
            a.typeValueListElement === b.typeValueListElement &&
            equalReference(a.semanticIdListElement, b.semanticIdListElement) &&
            queueReferables(a.value, b.value)
        );
    }

    function equalLangStrings(a?: aas.LangString[], b?: aas.LangString[]): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.length === b.length) {
            for (let i = 0, n = a.length; i < n; i++) {
                if (!equalLangString(a[i], b[i])) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    function equalAnnotatedRelationshipElement(
        a: aas.AnnotatedRelationshipElement,
        b: aas.AnnotatedRelationshipElement,
    ): boolean {
        return (
            equalSubmodelElement(a, b) &&
            equalRelationshipElement(a, b) &&
            queueReferables(a.annotations, b.annotations)
        );
    }

    function equalBasicEventElement(a: aas.BasicEventElement, b: aas.BasicEventElement): boolean {
        return (
            equalSubmodelElement(a, b) &&
            a.direction === b.direction &&
            a.lastUpdate === b.lastUpdate &&
            a.maxInterval === b.maxInterval &&
            equalReference(a.messageBroker, b.messageBroker) &&
            a.messageTopic === b.messageTopic &&
            a.minInterval === b.minInterval &&
            equalReference(a.observed, b.observed) &&
            a.state === b.state
        );
    }

    function equalCapability(a: aas.Capability, b: aas.Capability): boolean {
        return equalSubmodelElement(a, b);
    }

    function equalOperation(a: aas.Operation, b: aas.Operation): boolean {
        return (
            equalSubmodelElement(a, b) &&
            equalOperationVariables(a.inputVariables, b.inoutputVariables) &&
            equalOperationVariables(a.inoutputVariables, b.inoutputVariables) &&
            equalOperationVariables(a.outputVariables, b.outputVariables)
        );
    }

    function equalOperationVariables(
        a: aas.OperationVariable[] | undefined,
        b: aas.OperationVariable[] | undefined,
    ): boolean {
        if (a === b) {
            return true;
        }

        if (!a || !b || a.length !== b.length) {
            return false;
        }

        for (let i = 0, n = a.length; i < n; i++) {
            if (!equalOperationVariable(a[i], b[i])) {
                return false;
            }
        }

        return true;
    }

    function equalOperationVariable(a: aas.OperationVariable, b: aas.OperationVariable): boolean {
        if (a === b) {
            return true;
        }

        return equal(a.value, b.value);
    }

    function equalRange(a: aas.Range, b: aas.Range): boolean {
        return equalSubmodelElement(a, b) && a.max === b.max && a.min === b.min && a.valueType === b.valueType;
    }

    function equalRelationshipElement(a: aas.RelationshipElement, b: aas.RelationshipElement): boolean {
        return equalSubmodelElement(a, b) && equalReference(a.first, b.first) && equalReference(a.second, b.second);
    }

    function equalReferenceElement(a: aas.ReferenceElement, b: aas.ReferenceElement): boolean {
        return equalSubmodelElement(a, b) && equalReference(a.value, b.value);
    }

    function equalEntity(a: aas.Entity, b: aas.Entity): boolean {
        return (
            equalSubmodelElement(a, b) &&
            a.entityType == b.entityType &&
            a.globalAssetId === b.globalAssetId &&
            equalSpecificAssetIds(a.specificAssetIds, b.specificAssetIds) &&
            queueReferables(a.statements, b.statements)
        );
    }

    function equalSpecificAssetIds(a?: aas.SpecificAssetId[], b?: aas.SpecificAssetId[]): boolean {
        if (a === b) {
            return true;
        }

        if (!a || !b || a.length != b.length) {
            return false;
        }

        for (let i = 0, n = a.length; i < n; i++) {
            if (!equalSpecificAssetId(a[i], b[i])) {
                return false;
            }
        }

        return true;
    }

    function equalSpecificAssetId(a?: aas.SpecificAssetId, b?: aas.SpecificAssetId): boolean {
        return (
            a === b ||
            (a != null &&
                b != null &&
                equalHasSemantics(a, b) &&
                a.name === b.name &&
                a.value === b.value &&
                equalReference(a.externalSubjectId, b.externalSubjectId))
        );
    }

    function equalFile(a: aas.File, b: aas.File): boolean {
        return equalSubmodelElement(a, b) && a.contentType === b.contentType && a.value === b.value;
    }

    function equalBlob(a: aas.Blob, b: aas.Blob): boolean {
        return equalSubmodelElement(a, b) && a.contentType === b.contentType && a.value === b.value;
    }

    function equalConceptDescription(a: aas.ConceptDescription, b: aas.ConceptDescription): boolean {
        return equalSubmodelElement(a, b) && equalReferences(a.isCaseOf, b.isCaseOf);
    }

    function equalLangString(a: aas.LangString, b: aas.LangString): boolean {
        return a.language === b.language && a.text === b.text;
    }

    function equalReferences(a?: aas.Reference[], b?: aas.Reference[]): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.length === b.length) {
            for (let i = 0, n = a.length; i < n; i++) {
                if (!equalReference(a[i], b[i])) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    function equalReference(a?: aas.Reference, b?: aas.Reference): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && a.keys && b.keys && a.keys.length === b.keys.length) {
            for (let i = 0, n = a.keys.length; i < n; i++) {
                if (!equalKey(a.keys[i], b.keys[i])) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    function equalKey(a: aas.Key, b: aas.Key): boolean {
        return a.type === b.type && a.value === b.value;
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
 * @param env The AssetAdministration Shell environment.
 * @param reference The reference.
 * @returns The referable or `undefined`.
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
 * @param args The path to the SubmodelElement.
 * @returns The `Referable` at the specified path.
 */
export function selectElement<T extends aas.Referable>(env: aas.Environment, ...args: string[]): T | undefined {
    let current: aas.Referable | undefined;
    if (args.length > 0) {
        current = env.submodels?.find(item => item.idShort === args[0] || item.id === args[0]);
        if (current) {
            for (const idShort of args.slice(1).flatMap(item => item.split('.'))) {
                if (current.modelType === 'Submodel') {
                    current = (current as aas.Submodel).submodelElements?.find(item => item.idShort === idShort);
                } else if (current.modelType === 'SubmodelElementCollection') {
                    current = (current as aas.SubmodelElementCollection).value?.find(item => item.idShort === idShort);
                } else if (current.modelType === 'SubmodelElementList') {
                    current = (current as aas.SubmodelElementList).value?.find(item => item.idShort === idShort);
                }

                if (!current) {
                    break;
                }
            }
        }
    }

    return current as T;
}

/**
 * Resolves the specified reference.
 * @param env The Asset Administration Shell environment.
 * @param reference The reference.
 * @returns The referables that belongs to the specified reference.
 */
export function resolveReference(env: aas.Environment, reference: aas.Reference): aas.Referable[] | undefined {
    let parent: aas.Referable | undefined;
    const referables: aas.Referable[] = [];
    for (const key of reference.keys) {
        let referable: aas.Referable | undefined = undefined;
        let children: aas.SubmodelElement[] | undefined = undefined;
        if (parent) {
            switch (parent.modelType) {
                case 'Submodel':
                    children = (parent as aas.Submodel).submodelElements;
                    break;
                case 'SubmodelElementCollection':
                    children = (parent as aas.SubmodelElementCollection).value;
                    break;
                case 'SubmodelElementList':
                    children = (parent as aas.SubmodelElementList).value;
                    break;
                default:
                    return undefined;
            }

            referable = children?.find(child => child.idShort === key.value);
        } else {
            if (key.type === 'Submodel') {
                referable = env.submodels.find(item => item.id === key.value);
            } else if (key.type === 'AssetAdministrationShell') {
                referable = env.assetAdministrationShells.find(item => item.id === key.value);
            } else if (key.type === 'ConceptDescription') {
                referable = env.conceptDescriptions.find(item => item.id === key.value);
            }
        }

        if (!referable) {
            return undefined;
        }

        referables.push(referable);
        parent = referable;
    }

    return referables;
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
            if (
                getPath(item.dataSpecification) ===
                'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360'
            ) {
                return item.dataSpecificationContent as aas.DataSpecificationIec61360;
            }
        }
    } else {
        const semanticId = (referable as aas.HasSemantics).semanticId;
        if (semanticId) {
            const conceptDescription = selectReferable(env, semanticId);
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
                return env && env.submodels ? env.submodels : [];
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
 * Gets all concept description identifiers that are available in the specified referable and its descendants.
 * @param referable The current referable.
 * @returns The available semantic identifiers.
 */
export function getConceptDescriptionIds(referable: aas.Referable): string[] {
    const result = new Set<string>();
    for (const element of flat(referable)) {
        if (isHasSemantics(element)) {
            const semanticId = element.semanticId;
            if (semanticId && semanticId.type === 'ExternalReference') {
                const key = semanticId.keys.at(0);
                if (key && key.type === 'GlobalReference') {
                    result.add(key.value);
                }
            }
        }
    }

    return [...result.values()];
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
