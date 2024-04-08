import { aas } from 'common';

export type ArcheType = 'Full' | 'OneDown' | 'OneUp';

export abstract class HierarchicalStructureElement {
    protected getProperty(
        submodelElements: aas.SubmodelElement[] | undefined,
        semanticId: string,
    ): aas.Property | undefined {
        return submodelElements?.find(
            element =>
                element.modelType === 'Property' &&
                HierarchicalStructureElement.getSemanticId(element.semanticId) === semanticId,
        ) as aas.Property;
    }

    protected getEntity(
        submodelElements: aas.SubmodelElement[] | undefined,
        semanticId: string,
    ): aas.Entity | undefined {
        return submodelElements?.find(
            element =>
                element.modelType === 'Entity' &&
                HierarchicalStructureElement.getSemanticId(element.semanticId) === semanticId,
        ) as aas.Entity;
    }

    protected getRelationship(
        submodelElements: aas.SubmodelElement[] | undefined,
        semanticId: string,
    ): aas.RelationshipElement | undefined {
        return submodelElements?.find(
            element =>
                element.modelType === 'RelationshipElement' &&
                HierarchicalStructureElement.getSemanticId(element.semanticId) === semanticId,
        ) as aas.RelationshipElement;
    }

    protected static getSemanticId(reference: aas.Reference | undefined): string | undefined {
        return reference && reference.keys.length > 0 ? reference.keys[0].value : undefined;
    }
}

export class EntryNode extends HierarchicalStructureElement {
    public constructor(
        public readonly archeType: ArcheType,
        private readonly entity: aas.Entity,
    ) {
        super();
    }

    public get parent(): Node | null {
        return null;
    }

    public get children(): Node[] {
        if (this.archeType === 'OneDown') {
        }

        return [];
    }
}

export class Node extends HierarchicalStructureElement {
    public constructor(
        private readonly entryNode: EntryNode,
        private readonly entity: aas.Entity,
    ) {
        super();

        this.bulkCount = this.initBulkCount();
    }

    public readonly bulkCount: number;

    private initBulkCount(): number {
        const property = this.getProperty(
            this.entity.statements,
            'https://admin-shell.io/idta/HierarchicalStructures/BulkCount/1/0',
        );

        if (!property || !property.value) {
            throw new Error('Missing BulkCount Property.');
        }

        return Number(property.value);
    }
}

export class HierarchicalStructure extends HierarchicalStructureElement {
    public constructor(private readonly submodel: aas.Submodel) {
        super();

        this.archeType = this.initArcheType();
        this.entryNode = this.initEntryNode(this.archeType);
    }

    public readonly archeType: ArcheType;

    public readonly entryNode: EntryNode;

    public static isHierarchicalStructure(submodel: aas.Submodel): boolean {
        return (
            HierarchicalStructureElement.getSemanticId(submodel.semanticId) ===
            'https://admin-shell.io/idta/HierarchicalStructures/1/0/Submodel'
        );
    }

    private initArcheType(): ArcheType {
        const property = this.getProperty(
            this.submodel.submodelElements,
            'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
        );

        if (!property || !property.value) {
            throw new Error('Missing ArcheType Property.');
        }

        return property.value as ArcheType;
    }

    private initEntryNode(archeType: ArcheType): EntryNode {
        const entity = this.getEntity(
            this.submodel.submodelElements,
            'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0',
        );

        if (!entity) {
            throw new Error('Missing EntryNode Entity.');
        }

        return new EntryNode(archeType, entity);
    }
}
