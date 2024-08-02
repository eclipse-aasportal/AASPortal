/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, convertToString, determineType, noop } from 'aas-core';
import { ArgumentOptions, LocalizedText } from 'node-opcua';
import { Logger } from '../../logging/logger.js';
import { AASReader } from '../aas-reader.js';
import { OpcuaDataTypeDictionary } from './opcua-data-type-dictionary.js';
import {
    OPCUAComponent,
    OPCUAProperty,
    TypeDefinition,
    UAEntityType,
    UAKey,
    UAKeyElements,
    ValueType,
} from './opcua.js';

export class OpcuaReader extends AASReader {
    public constructor(
        private readonly logger: Logger,
        private readonly origin: OPCUAComponent,
        private readonly dataTypes: OpcuaDataTypeDictionary,
    ) {
        super();
    }

    public readEnvironment(): aas.Environment {
        const conceptDescriptions = this.readConceptDescriptions();
        const assetAdministrationShells = this.readAssetAdministrationShells();
        const submodels: aas.Submodel[] = this.readSubmodels(this.origin);
        return { assetAdministrationShells, submodels, conceptDescriptions };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public read(data: unknown): aas.Referable {
        throw new Error('Not implemented.');
    }

    private readConceptDescriptions(): aas.ConceptDescription[] {
        // ToDo
        return [];
    }

    private readAssetAdministrationShells(): aas.AssetAdministrationShell[] {
        const shell = this.readAssetAdministrationShell(this.origin);
        return [shell];
    }

    private readAssetAdministrationShell(component: OPCUAComponent): aas.AssetAdministrationShell {
        const shell: aas.AssetAdministrationShell = {
            ...this.readIdentifiable(component),
            ...this.readHasDataSpecification(component),
            assetInformation: this.readAssetInformation(component),
        };

        const submodels = this.readReferenceList(component, 'Submodel');
        if (submodels) {
            shell.submodels = submodels;
        }

        return shell;
    }

    private readAssetInformation(component: OPCUAComponent): aas.AssetInformation {
        let assetKind: aas.AssetKind | undefined;
        let globalAssetId: string | undefined;
        const assetComponent = this.selectComponent(this.origin, 'Asset');
        if (assetComponent) {
            assetKind = this.readAssetKind(assetComponent, 'AssetKind') ?? 'Instance';
            globalAssetId = this.readIdentifier(assetComponent);
        } else {
            const infoComponent = this.selectComponent(component, undefined, 'AASAssetInformationType');
            if (infoComponent) {
                assetKind = this.readAssetKind(infoComponent, 'AssetKind') ?? 'Instance';
                globalAssetId = this.readReference(infoComponent, 'GlobalAssetId')?.keys[0].value;
            }
        }

        if (!assetKind) {
            throw new Error('AssetInformation.assetKind');
        }

        return { assetKind, globalAssetId };
    }

    private readSubmodels(parent: OPCUAComponent): aas.Submodel[] {
        let submodels: aas.Submodel[] | undefined;
        const component = this.selectComponent(parent, 'Submodel', 'AASReferenceList');
        if (component?.hasComponent) {
            submodels = [];
            for (const item of component.hasComponent) {
                if (item.typeDefinition === 'AASReferenceType' && item.hasAddIn) {
                    for (const addIn of item.hasAddIn) {
                        submodels.push(this.readSubmodel(addIn));
                    }
                }
            }
        }

        return submodels ?? [];
    }

    private readSubmodel(component: OPCUAComponent): aas.Submodel {
        const submodel: aas.Submodel = {
            ...this.readIdentifiable(component),
            ...this.readHasSemantic(component),
            ...this.readQualifiable(component),
            ...this.readHasKind(component),
            ...this.readHasDataSpecification(component),
        };

        const submodelElements = this.readSubmodelElements(component, {
            type: 'ModelReference',
            keys: [
                {
                    type: 'Submodel',
                    value: submodel.id,
                },
            ],
        });
        if (submodelElements.length > 0) {
            submodel.submodelElements = submodelElements;
        }

        return submodel;
    }

    private readSubmodelElements(component: OPCUAComponent, parent: aas.Reference): aas.SubmodelElement[] {
        const results = this.where(
            component.hasComponent,
            'AASBlobType',
            'AASCapabilityType',
            'AASEventType',
            'AASFileType',
            'AASPropertyType',
            'AASRangeType',
            'AASSubmodelElementCollectionType',
            'AASOrderedSubmodelElementCollectionType',
            'AASMultiLanguagePropertyType',
            'AASEntityType',
            'AASReferenceElementType',
            'AASRelationshipElementType',
            'AASOperationType',
        );

        const submodelElements: aas.SubmodelElement[] = [];
        for (const component of results) {
            const submodelElement = this.readSubmodelElement(component, parent);
            if (submodelElement) {
                submodelElements.push(submodelElement);
            }
        }

        return submodelElements;
    }

    private readSubmodelElement(component: OPCUAComponent, parent: aas.Reference): aas.SubmodelElement | undefined {
        switch (component.typeDefinition) {
            case 'AASBlobType':
                break;
            case 'AASCapabilityType':
                break;
            case 'AASEntityType':
                return this.readEntity(component, parent);
            case 'AASEventType':
                break;
            case 'AASFileType':
                return this.readFile(component, parent);
            case 'AASMultiLanguagePropertyType':
                return this.readMultiLanguageProperty(component, parent);
            case 'AASOperationType':
                return this.readOperation(component, parent);
            case 'AASOrderedSubmodelElementCollectionType':
                return this.readSubmodelElementCollection(component, parent);
            case 'AASPropertyType':
                return this.readProperty(component, parent);
            case 'AASRangeType':
                break;
            case 'AASReferenceElementType':
                return this.readReferenceElement(component, parent);
            case 'AASRelationshipElementType':
                break;
            case 'AASSubmodelElementCollectionType':
                return this.readSubmodelElementCollection(component, parent);
        }

        return undefined;
    }

    private readModelType(component: OPCUAComponent): aas.ModelType {
        switch (component.typeDefinition) {
            case 'AASAssetAdministrationShellType':
                return 'AssetAdministrationShell';
            case 'AASSubmodelType':
                return 'Submodel';
            case 'AASPropertyType':
                return 'Property';
            case 'AASFileType':
                return 'File';
            case 'AASSubmodelElementCollectionType':
                return 'SubmodelElementCollection';
            case 'AASMultiLanguagePropertyType':
                return 'MultiLanguageProperty';
            case 'AASEntityType':
                return 'Entity';
            case 'AASReferenceElementType':
                return 'ReferenceElement';
            case 'AASOperationType':
                return 'Operation';
            default:
                throw new Error(`Type '${component.typeDefinition}' is not supported.`);
        }
    }

    private readSubmodelElementCollection(
        component: OPCUAComponent,
        parent: aas.Reference,
    ): aas.SubmodelElementCollection {
        const base = this.readSubmodelElementType(component, parent);
        const collection: aas.SubmodelElementCollection = {
            ...base,
        };

        const value = this.readSubmodelElements(component, this.createReference(parent, base));
        if (value.length > 0) {
            collection.value = value;
        }

        return collection;
    }

    private readProperty(component: OPCUAComponent, parent: aas.Reference): aas.Property {
        const value = this.readPropertyValue(component, 'Value');
        let valueType = this.readDataTypeDefXsd(this.readPropertyValue(component, 'ValueType'));
        if (!valueType && value != null) {
            valueType = determineType(value);
        }

        if (!valueType) {
            throw new Error('Property.valueType');
        }

        const property: aas.Property = {
            ...this.readSubmodelElementType(component, parent),
            valueType: valueType,
            nodeId: this.findProperty(component, 'Value')?.nodeId.toString(),
        };

        if (value) {
            property.value = convertToString(value);
        }

        return property;
    }

    private readFile(component: OPCUAComponent, parent: aas.Reference): aas.File {
        const contentType = this.readStringProperty(component, 'MimeType');
        if (!contentType) {
            throw new Error('File.mimeType');
        }

        const file: aas.File = {
            ...this.readSubmodelElementType(component, parent),
            contentType,
        };

        const value = this.readStringProperty(component, 'Value');
        if (value) {
            file.value = value;
        }

        const fileType = this.selectComponent(component, undefined, 'FileType');
        if (fileType) {
            file.nodeId = fileType.nodeId.toString();
        }

        return file;
    }

    private readMultiLanguageProperty(component: OPCUAComponent, parent: aas.Reference): aas.MultiLanguageProperty {
        const langString = this.readLangStringSet(component, 'Value') ?? [];
        return { ...this.readSubmodelElementType(component, parent), value: langString };
    }

    private readLangStringSet(component: OPCUAComponent, propertyName: string): aas.LangString[] | undefined {
        let langStrings: aas.LangString[] | undefined;
        const value: LocalizedText[] = this.readPropertyValue(component, propertyName);
        if (value) {
            langStrings = value.map(item => ({ language: item.locale, text: item.text }) as aas.LangString);
        }

        return langStrings;
    }

    private readEntity(component: OPCUAComponent, parent: aas.Reference): aas.Entity {
        const entityType: aas.EntityType | undefined = this.toEntityType(
            this.readPropertyValue(component, 'EntityType'),
        );
        if (!entityType) {
            throw new Error('Entity.entityType');
        }

        const entity: aas.Entity = {
            ...this.readSubmodelElementType(component, parent),
            entityType,
        };

        const asset = this.readReference(component, 'Asset');
        if (asset) {
            entity.globalAssetId = asset.keys[0].value;
        }

        //ToDo Entity.statements

        return entity;
    }

    private readReferenceElement(component: OPCUAComponent, parent: aas.Reference): aas.ReferenceElement {
        const value = this.readReference(component, 'Value');
        if (!value) {
            throw new Error('ReferenceElement.value');
        }

        return {
            ...this.readSubmodelElementType(component, parent),
            value,
        };
    }

    private readOperation(component: OPCUAComponent, parent: aas.Reference): aas.Operation {
        const inputVariables: aas.OperationVariable[] = [];
        const outputVariables: aas.OperationVariable[] = [];
        const inoutputVariables: aas.OperationVariable[] = [];
        let methodId: string | undefined;
        let objectId: string | undefined;
        const opComponent =
            this.selectComponent(component, undefined, 'Operation') ?? this.findOperationNode(component);
        if (opComponent) {
            methodId = opComponent.nodeId?.toString();
            objectId = component.nodeId?.toString();

            const inputArguments: ArgumentOptions[] = this.readPropertyValue(opComponent, 'InputArguments');
            if (inputArguments) {
                for (const inputArgument of inputArguments) {
                    inputVariables.push(this.createOperationVariable(inputArgument));
                }
            }

            const outputArguments: ArgumentOptions[] = this.readPropertyValue(opComponent, 'OutputArguments');
            if (outputArguments) {
                for (const outputArgument of outputArguments) {
                    outputVariables.push(this.createOperationVariable(outputArgument));
                }
            }
        }

        const operation: aas.Operation = { ...this.readSubmodelElementType(component, parent) };

        if (inputVariables) {
            operation.inputVariables = inputVariables;
        }

        if (inoutputVariables) {
            operation.inoutputVariables = inoutputVariables;
        }

        if (outputVariables) {
            operation.outputVariables = outputVariables;
        }

        if (objectId) {
            operation.objectId = objectId;
        }

        if (methodId) {
            operation.methodId = methodId;
        }

        return operation;
    }

    private readReference(parent: OPCUAComponent, name: string): aas.Reference | undefined {
        let reference: aas.Reference | undefined;
        const component = this.selectComponent(parent, name, 'AASReferenceType');
        if (component) {
            const value: UAKey[] = this.readPropertyValue(component, 'Keys');
            if (Array.isArray(value) && value.length > 0) {
                reference = { type: 'ModelReference', keys: value.map(key => this.readKey(key)) };
            }
        }

        return reference;
    }

    private readReferenceList(parent: OPCUAComponent, name: string): aas.Reference[] | undefined {
        let referenceList: aas.Reference[] | undefined;
        const component = this.selectComponent(parent, name, 'AASReferenceList');
        if (component?.hasComponent) {
            referenceList = [];
            for (const item of component.hasComponent) {
                if (item.typeDefinition === 'AASReferenceType') {
                    const value = this.findProperty(item, 'Keys')?.dataValue.value?.value;
                    if (Array.isArray(value) && value.length > 0) {
                        referenceList.push({ type: 'ModelReference', keys: value.map(key => this.readKey(key)) });
                    }
                }
            }
        }

        return referenceList;
    }

    private readKey(value: UAKey): aas.Key {
        return {
            type: this.toKeyTypes(value.type),
            value: value.value,
        };
    }

    private findOperationNode(element: OPCUAComponent): OPCUAComponent | undefined {
        if (element.hasComponent) {
            for (const component of element.hasComponent) {
                if (this.hasProperty(component, 'InputArguments') && this.hasProperty(component, 'OutputArguments')) {
                    return component;
                }
            }
        }

        return undefined;
    }

    private createOperationVariable(argument: ArgumentOptions): aas.OperationVariable {
        const value: aas.Property = {
            modelType: 'Property',
            idShort: argument.name!,
            valueType: this.dataTypes.get(argument.dataType),
        };

        return { value };
    }

    private readSubmodelElementType(component: OPCUAComponent, parent: aas.Reference): aas.SubmodelElement {
        return {
            ...this.readReferable(component, parent),
            ...this.readHasSemantic(component),
            ...this.readHasKind(component),
            ...this.readHasDataSpecification(component),
            ...this.readQualifiable(component),
        };
    }

    private readIdentifiable(component: OPCUAComponent): aas.Identifiable {
        const idComponent = this.selectComponent(component, 'Identification');
        if (!idComponent) {
            throw new Error('Identifiable.identification');
        }

        const id = this.readIdentifier(idComponent)!;
        const identifiable: aas.Identifiable = { ...this.readReferable(component), id };
        const adminInfoComponent = this.selectComponent(component, 'Administration');
        if (adminInfoComponent) {
            const administration = this.readAdministrativeInformation(adminInfoComponent);

            if (administration) {
                identifiable.administration = administration;
            }
        }

        return identifiable;
    }

    private readAdministrativeInformation(component: OPCUAComponent): aas.AdministrativeInformation | undefined {
        const info: aas.AdministrativeInformation = {};

        const version = this.readStringProperty(component, 'Version');
        if (version) {
            info.version = version;
        }

        const revision = this.readStringProperty(component, 'Revision');
        if (revision) {
            info.revision = revision;
        }

        return info;
    }

    private readReferable(component: OPCUAComponent, parent?: aas.Reference): aas.Referable {
        const referable: aas.Referable = {
            idShort: component.browseName,
            modelType: this.readModelType(component),
        };

        if (parent) {
            referable.parent = parent;
        }

        const category = this.readCategory(component, 'Category');
        if (category) {
            referable.category = category;
        }

        const description = this.readLangStringSet(component, 'Description');
        if (description) {
            referable.description = description;
        }

        return referable;
    }

    private readHasSemantic(component: OPCUAComponent): aas.HasSemantics {
        const semanticId = this.readReference(component, 'SemanticId');
        return semanticId ? { semanticId } : {};
    }

    private readHasKind(component: OPCUAComponent): aas.HasKind {
        return { kind: this.readModellingKind(component, 'ModellingKind') ?? 'Instance' };
    }

    private readHasDataSpecification(component: OPCUAComponent): aas.HasDataSpecification {
        const dataSpecification: aas.HasDataSpecification = {};
        const child = this.selectComponent(component, 'DataSpecification', 'AASReferenceList');
        if (child?.hasComponent) {
            // ToDo:
        }

        return dataSpecification;
    }

    private readQualifiable(component: OPCUAComponent): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        const child = this.selectComponent(component, 'Qualifier', 'AASQualifierList');
        if (child?.hasComponent) {
            noop();
        }

        return qualifiable;
    }

    private readIdentifier(component: OPCUAComponent): string {
        const id = this.readStringProperty(component, 'Id');
        if (!id) {
            throw new Error('Identifier.id');
        }

        return id;
    }

    private selectComponent(parent: OPCUAComponent, name?: string, type?: TypeDefinition): OPCUAComponent | undefined {
        return parent.hasComponent?.find(
            component => (!name || component.browseName === name) && (!type || type === component.typeDefinition),
        );
    }

    private hasProperty(component: OPCUAComponent, browseName: string): boolean {
        if (component.hasProperty) {
            for (const property of component.hasProperty) {
                if (property.browseName === browseName) {
                    return true;
                }
            }
        }

        return false;
    }

    private findProperty(component: OPCUAComponent, browseName: string): OPCUAProperty | undefined {
        if (component.hasProperty) {
            for (const property of component.hasProperty) {
                if (property.browseName === browseName) {
                    return property;
                }
            }
        }

        return undefined;
    }

    private readStringProperty(component: OPCUAComponent, propertyName: string): string | undefined {
        const property = this.findProperty(component, propertyName);
        const value = property?.dataValue.value?.value;
        if (value && typeof value !== 'string') {
            throw new Error(`Unexpected value type: expected string, actual ${typeof value}`);
        }

        return value;
    }

    private readAssetKind(component: OPCUAComponent, propertyName: string): aas.AssetKind | undefined {
        const property = this.findProperty(component, propertyName);
        if (!property) {
            return undefined;
        }

        const value = property.dataValue.value?.value;
        if (!value) {
            return undefined;
        }

        if (typeof value === 'string') {
            return value as aas.AssetKind;
        }

        if (typeof value === 'number') {
            switch (value) {
                case 0:
                    return 'Type';
                case 1:
                    return 'Instance';
            }
        }

        throw new Error(`Unexpected value type: expected string or number, actual ${typeof value}`);
    }

    private readCategory(component: OPCUAComponent, propertyName: string): string | undefined {
        const property = this.findProperty(component, propertyName);
        if (!property) {
            return undefined;
        }

        const value = property.dataValue.value?.value;
        if (!value) {
            return undefined;
        }

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number') {
            switch (value) {
                case 0:
                    return 'CONSTANT';
                case 1:
                    return 'PARAMETER';
                default:
                    return 'VARIABLE';
            }
        }

        throw new Error(`Unexpected value type: expected string or number, actual ${typeof value}`);
    }

    private readModellingKind(component: OPCUAComponent, propertyName: string): aas.ModellingKind | undefined {
        const property = this.findProperty(component, propertyName);
        if (!property) {
            return undefined;
        }

        const value = property.dataValue.value?.value;
        if (!value) {
            return undefined;
        }

        if (typeof value === 'string') {
            return value as aas.ModellingKind;
        }

        if (typeof value === 'number') {
            switch (value) {
                case 0:
                    return 'Template';
                case 1:
                    return 'Instance';
            }
        }

        throw new Error(`Unexpected value type: expected string or number, actual ${typeof value}`);
    }

    private readPropertyValue<T>(component: OPCUAComponent, propertyName: string): T {
        const property = this.findProperty(component, propertyName);
        return property?.dataValue.value?.value;
    }

    private where(components: OPCUAComponent[] | undefined, ...types: TypeDefinition[]): OPCUAComponent[] {
        const items: OPCUAComponent[] = [];
        if (components) {
            const set = new Set<string>(types);
            for (const component of components) {
                if (set.has(component.typeDefinition)) {
                    items.push(component);
                } else if (component.typeDefinition === 'AASReferenceList') {
                    if (component.browseName === 'Submodel' && component.hasComponent) {
                        for (const submodelReference of component.hasComponent) {
                            if (submodelReference.hasAddIn) {
                                for (const addInComponent of submodelReference.hasAddIn) {
                                    if (set.has(addInComponent.typeDefinition)) {
                                        items.push(addInComponent);
                                    }
                                }
                            }
                        }
                    }
                } else if (component.typeDefinition === 'FolderType') {
                    if (component.hasComponent) {
                        for (const folderComponent of component.hasComponent) {
                            if (set.has(folderComponent.typeDefinition)) {
                                items.push(folderComponent);
                            }
                        }
                    }
                }
            }
        }

        return items;
    }

    private toKeyTypes(value: UAKeyElements): aas.KeyTypes {
        return UAKeyElements[value] as aas.KeyTypes;
    }

    private toEntityType(value?: UAEntityType | string): aas.EntityType | undefined {
        if (typeof value === 'string') {
            return value as aas.EntityType;
        }

        return value ? (UAEntityType[value] as aas.EntityType) : undefined;
    }

    private readDataTypeDefXsd(value?: ValueType | string): aas.DataTypeDefXsd | undefined {
        if (value) {
            const valueType = typeof value === 'string' ? value : ValueType[value];
            switch (valueType) {
                case 'Boolean':
                    return 'xs:boolean';
                case 'SByte':
                    return 'xs:byte';
                case 'Byte':
                    return 'xs:unsignedByte';
                case 'Int16':
                    return 'xs:short';
                case 'UInt16':
                    return 'xs:unsignedShort';
                case 'Int32':
                    return 'xs:int';
                case 'UInt32':
                    return 'xs:unsignedInt';
                case 'Int64':
                    return 'xs:long';
                case 'UInt64':
                    return 'xs:unsignedLong';
                case 'Float':
                    return 'xs:float';
                case 'Double':
                    return 'xs:double';
                case 'LocalizedText':
                case 'String':
                    return 'xs:string';
                case 'DateTime':
                    return 'xs:dateTime';
                default:
                    return valueType as aas.DataTypeDefXsd;
            }
        }

        return undefined;
    }
}
