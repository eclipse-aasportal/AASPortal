/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgTemplateOutlet } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Component, computed, effect, inject, input, OnDestroy, signal, WritableSignal } from '@angular/core';

import {
    aas,
    AASDocument,
    convertToString,
    getChildren,
    getLocaleValue,
    getUnit,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    isSubmodelElementList,
    LiveNode,
    LiveRequest,
    WebSocketData,
} from 'aas-core';

import { getDisplayName, getUrl } from '../../utilities';
import { WebSocketService } from '../../shared/services/web-socket.service';

export type SubmodelTreeItem = {
    idShort: string;
    name: string;
    value: WritableSignal<string | undefined>;
    unit: string | undefined;
    type: 'text' | 'link';
    element: aas.SubmodelElement;
    url?: string;
    isOnline?: boolean;
};

export type SubmodelTreeGroup = {
    idShort: string;
    name: string;
    items: SubmodelTreeItem[];
    path: string; // '<submodel idShort>/Machine/Motor'
    level: number; // 0, 1, 2 ...
};

/**
 * Read-only, searchable, collapsible tree of a submodel's Properties/MultiLanguageProperties/Files,
 * grouped by SubmodelElementCollection/List, with live (WebSocket) value updates for properties
 * that carry an OPC UA nodeId. Shared by OperationalDataView and GenericSubmodelView — the two
 * previously had this logic duplicated in full.
 */
@Component({
    selector: 'fhg-submodel-tree',
    templateUrl: './submodel-tree.html',
    styleUrl: './submodel-tree.scss',
    imports: [NgTemplateOutlet],
})
export class SubmodelTree implements OnDestroy {
    private readonly translate = inject(TranslateService);
    private readonly webSocket = inject(WebSocketService);
    private readonly map = new Map<string, SubmodelTreeItem>();
    private liveNodes: LiveNode[] = [];
    private webSocketSubscription?: Subscription;

    public constructor() {
        effect(() => {
            this.groups();
            this.stop();
            if (this.liveNodes.length > 0) {
                this.play();
            }
        });

        effect(() => {
            const all = this.groups().map(g => g.path);
            this.expanded.set(new Set(all));
        });
    }

    /** The submodel to display. */
    public readonly submodel = input<aas.Submodel | undefined>(undefined);

    /** The AAS document the submodel belongs to (needed to resolve File element URLs). */
    public readonly document = input<AASDocument | undefined>(undefined);

    public readonly expanded = signal<ReadonlySet<string>>(new Set());
    public readonly query = signal('');

    private readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');

    public readonly groups = computed<SubmodelTreeGroup[]>(() => {
        this.map.clear();
        this.liveNodes = [];

        const submodel = this.submodel();
        if (!submodel?.submodelElements) {
            return [];
        }

        const groups: SubmodelTreeGroup[] = [];
        this.collect(submodel, 0, '', groups);
        return groups;
    });

    public rootGroup = computed(() => this.groups()[0]);

    public childGroups(path: string): SubmodelTreeGroup[] {
        const visible = this.filtered().visible;
        return this.groups().filter(
            g => g.path.startsWith(path + '/') && !g.path.slice(path.length + 1).includes('/') && visible.has(g.path),
        );
    }

    public isExpanded(path: string): boolean {
        return this.query().trim().length > 0 || this.expanded().has(path);
    }

    public toggle(path: string): void {
        const next = new Set(this.expanded());
        next.has(path) ? next.delete(path) : next.add(path);
        this.expanded.set(next); // new Set, so the signal actually fires
    }

    public itemsOf(path: string): SubmodelTreeItem[] {
        return this.filtered().itemsByPath.get(path) ?? [];
    }

    public matchCount = computed(() =>
        [...this.filtered().itemsByPath.values()].reduce((n, items) => n + items.length, 0),
    );

    public ngOnDestroy(): void {
        this.webSocketSubscription?.unsubscribe();
    }

    private readonly filtered = computed(() => {
        const q = this.query().trim().toLowerCase();
        const visible = new Set<string>();
        const itemsByPath = new Map<string, SubmodelTreeItem[]>();

        for (const group of this.groups()) {
            const nameHit = q.length > 0 && group.name.toLowerCase().includes(q);
            const items = !q || nameHit ? group.items : group.items.filter(i => i.name.toLowerCase().includes(q));

            itemsByPath.set(group.path, items);

            if (!q || items.length > 0 || nameHit) {
                const parts = group.path.split('/');
                for (let i = 1; i <= parts.length; i++) {
                    visible.add(parts.slice(0, i).join('/'));
                }
            }
        }

        return { visible, itemsByPath };
    });

    private collect(referable: aas.Referable, level: number, parentPath: string, out: SubmodelTreeGroup[]): void {
        const path = parentPath ? `${parentPath}/${referable.idShort}` : referable.idShort;
        const children = getChildren(referable);

        out.push({ ...this.createGroup(referable, children), path, level });

        for (const child of children) {
            if ((isSubmodelElementCollection(child) || isSubmodelElementList(child)) && child.value) {
                this.collect(child, level + 1, path, out);
            }
        }
    }

    private createGroup(parent: aas.Referable, children: aas.Referable[]): Omit<SubmodelTreeGroup, 'path' | 'level'> {
        const currentLang = this.currentLang();
        const document = this.document();
        const env = document?.content;
        const items: SubmodelTreeItem[] = [];
        for (const child of children) {
            if (isProperty(child)) {
                const item: SubmodelTreeItem = {
                    idShort: child.idShort,
                    name: getDisplayName(child, env, currentLang),
                    value: signal(child.value),
                    type: 'text',
                    element: child,
                    unit: env ? getUnit(env, child) : undefined,
                };

                items.push(item);

                if (child.nodeId) {
                    this.liveNodes.push({
                        nodeId: child.nodeId,
                        valueType: child.valueType ?? 'undefined',
                    });

                    this.map.set(child.nodeId, item);
                    item.isOnline = true;
                }
            } else if (isMultiLanguageProperty(child)) {
                if (!child.value || child.value.length === 0) {
                    continue;
                }

                items.push({
                    idShort: child.idShort,
                    name: getDisplayName(child, env, currentLang),
                    value: signal(getLocaleValue(child.value, currentLang)),
                    type: 'text',
                    element: child,
                    unit: env ? getUnit(env, child) : undefined,
                });
            } else if (isFile(child)) {
                if (!child.value || !document) {
                    continue;
                }

                items.push({
                    idShort: child.idShort,
                    name: getDisplayName(child, env, currentLang),
                    value: signal(child.value),
                    type: 'link',
                    element: child,
                    url: getUrl(document, child),
                    unit: env ? getUnit(env, child) : undefined,
                });
            }
        }

        return {
            idShort: parent.idShort,
            name: getDisplayName(parent, null, currentLang),
            items,
        };
    }

    private play(): void {
        const document = this.document();
        if (!document) {
            return;
        }

        this.webSocketSubscription = this.webSocket.getMessages().subscribe({
            next: this.onMessage,
            error: this.onError,
        });

        this.webSocket.sendMessage(this.createMessage(document));
    }

    private stop(): void {
        if (this.webSocketSubscription) {
            this.webSocketSubscription.unsubscribe();
            this.webSocketSubscription = undefined;
        }
    }

    private createMessage(document: AASDocument): WebSocketData {
        return {
            type: 'LiveRequest',
            data: { endpoint: document.endpoint, id: document.id, nodes: this.liveNodes } satisfies LiveRequest,
        };
    }

    private onMessage = (data: WebSocketData): void => {
        if (data.type === 'LiveNode[]') {
            for (const node of data.data as LiveNode[]) {
                const item = this.map.get(node.nodeId);
                if (item === undefined) {
                    continue;
                }

                item.value.set(convertToString(node.value, this.currentLang()));
            }
        }
    };

    private onError = (error: unknown): void => {
        console.error(error);
    };
}
