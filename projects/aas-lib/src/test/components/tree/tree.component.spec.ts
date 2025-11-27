/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { DOCUMENT, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tree, TreeComponent, TreeNode, TreeService } from '../../../lib/components/tree/tree.component';

describe('TreeComponent', () => {
    let component: TreeComponent;
    let fixture: ComponentFixture<TreeComponent>;
    let service: TreeService;
    let tree: Tree;

    function createComposite(id: string, parent: string | null): TreeNode {
        return {
            parent,
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
            parent,
            id,
            path: id,
            level: id.split('.').length - 1,
            name: id,
            expanded: false,
            selected: false,
            highlighted: false,
            loaded: false,
            isLeaf: true,
            hasChildren: false,
            symbolType: 'text',
            symbol: id,
            type: 'text',
            options: {},
        };
    }

    beforeEach(async () => {
        service = {
            getThumbnail: function (node: TreeNode): string {
                return node.symbol ?? '';
            },

            loadChildren: function (parent: TreeNode): { parent: TreeNode; children: TreeNode[] } {
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
            },

            loaded: (node: TreeNode): void  => {},

            getRouterLink: function (node: TreeNode): unknown[] | undefined {
                return [node.name];
            },

            getUrl: function (node: TreeNode): string {
                return node.name;
            },
        };

        tree = [createComposite('A', null), createComposite('B', null)];

        await TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
            imports: [TreeComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TreeComponent);
        fixture.componentRef.setInput('service', service);
        fixture.componentRef.setInput('tree', tree);
        fixture.componentRef.setInput('selectionMode', 'single');
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.expanded()).toBe(false);
        expect(component.selectionMode()).toBe('single');
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
        expect(component.nodes()[0].expanded).toBe(true);
        expect(component.nodes().map(item => item.name)).toEqual(['A', 'A.1', 'A.2', 'B']);

        component.collapse(component.nodes()[0]);
        expect(component.nodes()[0].expanded).toBe(false);
        expect(component.nodes().map(item => item.name)).toEqual(['A', 'B']);
    });

    it('should highlight "A.2.3.1"', () => {
        jest.useFakeTimers();
        const A_2_3_1 = 7;
        const document = TestBed.inject(DOCUMENT);
        jest.spyOn(document, 'getElementById');
        component.highlight(7);
        jest.runAllTimers();
        expect(component.nodes()[6].name).toBe('A.2.3.1');
        expect(component.nodes()[6].highlighted).toBe(true);
        expect(document.getElementById).toHaveBeenCalledWith('A.2.3.1');
        jest.useRealTimers();
    });
});
