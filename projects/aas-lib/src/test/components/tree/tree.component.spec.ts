/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vitest } from 'vitest';
import { Component, DOCUMENT, effect, inject, Injectable, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { noop } from 'aas-core';
import { FakeLoader } from '../../mocks';
import { TreeComponent, TreeId, TreeNode, TreeResult } from '../../../lib/components/tree/tree.component';

function createComposite(id: string, parent: string | null): TreeNode {
    return {
        parentId: parent,
        id,
        path: id,
        level: id.split('.').length - 1,
        name: id,
        expanded: false,
        selected: false,
        highlighted: false,
        loaded: false,
        isLeaf: false,
        hasChildren: true,
        symbolType: 'text',
        symbol: id,
        type: 'text',
        options: {},
    };
}

function createLeaf(id: string, parent: string | null): TreeNode {
    return {
        parentId: parent,
        id,
        path: id,
        level: id.split('.').length - 1,
        name: id,
        selected: false,
        highlighted: false,
        isLeaf: true,
        symbolType: 'text',
        symbol: id,
        type: 'text',
        options: {},
    };
}

@Injectable()
export class TreeSearch {
    public readonly matchIndex = signal(-1);
}

@Component({ template: '<div></div>', standalone: true })
class TestTreeComponent extends TreeComponent {
    private readonly treeSearch = inject(TreeSearch);

    public constructor() {
        super();

        const tree = [createComposite('A', null), createComposite('B', null)];
        this.update({ tree });

        effect(() => {
            this.update({ matchIndex: this.treeSearch.matchIndex() });
        });
    }

    public override getRouterLink(node: TreeNode): unknown[] | undefined {
        return [node.name];
    }

    public override getUrl(node: TreeNode): string | undefined {
        return node.name;
    }

    public override ngAfterViewInit(): void {
    }

    protected override loadChildren(parent: TreeNode): TreeResult | undefined {
        switch (parent.path) {
            case 'A':
                return { parent, children: [createLeaf('A.1', 'A'), createComposite('A.2', 'A')] };

            case 'B':
                return { parent, children: [createLeaf('B.1', 'B'), createLeaf('B.2', 'B')] };

            case 'A.2':
                return {
                    parent,
                    children: [
                        createLeaf('A.2.1', 'A.2'),
                        createComposite('A.2.2', 'A.2'),
                        createComposite('A.2.3', 'A.2'),
                    ],
                };

            case 'A.2.2':
                return { parent, children: [createLeaf('A.2.2.1', 'A.2.2')] };

            case 'A.2.3':
                return { parent, children: [createLeaf('A.2.3.1', 'A.2.3')] };

            default:
                throw new Error(`Unknown parent ${parent.path}`);
        }
    }

    protected override loaded(node: TreeNode): void {
        noop(node);
    }

    protected override start(
        nodes: TreeNode<TreeId, Record<string, unknown>>[],
        searchExpression: string | undefined,
    ): void {
        noop(nodes, searchExpression);
    }
}

describe('TreeComponent', () => {
    let component: TreeComponent;
    let fixture: ComponentFixture<TreeComponent>;
    let treeSearch: TreeSearch;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: TreeSearch,
                    useClass: TreeSearch
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [TestTreeComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestTreeComponent);
        fixture.componentRef.setInput('allowSelection', true);
        component = fixture.componentInstance;
        fixture.detectChanges();
        treeSearch = TestBed.inject(TreeSearch);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.expanded()).toBe(false);
        expect(component.allowSelection()).toBe(true);
        expect(component.nodes().map(item => item.path)).toEqual(['A', 'B']);
    });

    it('should expand/collapse the tree', () => {
        component.expand();
        expect(component.nodes().every(node => node.isLeaf || node.expanded)).toBe(true);
        expect(component.nodes().map(item => item.name)).toEqual([
            'A',
            'A.1',
            'A.2',
            'A.2.1',
            'A.2.2',
            'A.2.2.1',
            'A.2.3',
            'A.2.3.1',
            'B',
            'B.1',
            'B.2',
        ]);

        component.collapse();
        expect(component.nodes().length).toBe(2);
        expect(component.nodes().every(node => node.isLeaf || !node.expanded)).toBe(true);
        expect(component.nodes().map(item => item.name)).toEqual(['A', 'B']);
    });

    it('should expand/collapse "A"', () => {
        component.expand(component.nodes()[0]);
        expect(component.isExpanded(component.nodes()[0])).toBe(true);
        expect(component.nodes().map(item => item.name)).toEqual(['A', 'A.1', 'A.2', 'B']);

        component.collapse(component.nodes()[0]);
        expect(component.isExpanded(component.nodes()[0])).toBe(false);
        expect(component.nodes().map(item => item.name)).toEqual(['A', 'B']);
    });

    it('should highlight "A.2.3.1"', () => {
        vitest.useFakeTimers();
        const A_2_3_1 = 7;
        const document = TestBed.inject(DOCUMENT);
        vitest.spyOn(document, 'getElementById');
        treeSearch.matchIndex.set(10);
        fixture.detectChanges();
        vitest.runAllTimers();
        expect(component.nodes()[6].name).toBe('A.2.3.1');
        expect(component.nodes()[6].highlighted).toBe(true);
        expect(component.highlighted()?.name).toBe('A.2.3.1');
        expect(document.getElementById).toHaveBeenCalledWith('A.2.3.1');
        vitest.useRealTimers();
    });

    it('should select/deselect all node', () => {
        component.expand();
        component.toggleSelection();
        expect(component.nodes().every(node => node.selected)).toBe(true);
        expect(component.selectedNodes().length).toBe(component.nodes().length);
        component.toggleSelection();
        expect(component.nodes().every(node => !node.selected));
        expect(component.selectedNodes().length).toBe(0);
    });

    it('should select/deselect a tree node', () => {
        component.expand();
        component.toggleSelection(component.nodes()[4]);
        expect(component.nodes()[4].selected).toBe(true);
        expect(component.selectedNodes()).toContain(component.nodes()[4]);
        component.toggleSelection(component.nodes()[4]);
        expect(component.nodes()[4].selected).toBe(false);
        expect(component.selectedNodes()).not.toContain(component.nodes()[4]);
    });
});
