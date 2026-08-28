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
    getAbbreviation,
    getChildren,
    getLocaleValue,
    getUnit,
    isAnnotatedRelationshipElement,
    isBasicEventElement,
    isEntity,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isRange,
    isReferenceElement,
    isRelationshipElement,
    isSubmodelElementCollection,
    isSubmodelElementList,
    LiveNode,
    LiveRequest,
    WebSocketData,
} from 'aas-core';

import { getDisplayName, getElementDescription, getUrl, referenceToString } from '../../utilities';
import { WebSocketService } from '../../shared/services/web-socket.service';

export type SubmodelTreeItem = {
    idShort: string;
    name: string;
    /** Short element-type abbreviation, e.g. 'Prop', 'MLP', 'Rel' — same as AasTree's node.symbol. */
    typeAbbreviation: string | undefined;
    /** A short, type-specific description (value type, item count, content type, ...). */
    description: string;
    value: WritableSignal<string | undefined>;
    unit: string | undefined;
    /** 'none' for element types with no single meaningful value to display inline (e.g. Blob, Operation, Capability). */
    type: 'text' | 'link' | 'none';
    element: aas.SubmodelElement;
    url?: string;
    isOnline?: boolean;
    isProse?: boolean;
};

export type SubmodelTreeGroup = {
    idShort: string;
    name: string;
    /** Short element-type abbreviation, e.g. 'SMC', 'SML'. */
    typeAbbreviation: string | undefined;
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
            const groups = this.groups();
            // Auto-expanding every group is fine (and nice: no extra clicks) for a typical submodel,
            // but for a very large/deeply nested one (e.g. a full ECLASS TechnicalData tree with
            // thousands of nested collections) it means the *entire* tree renders as DOM at once,
            // recursively, via *ngTemplateOutlet -- easily enough to hang the page even with the
            // underlying data computed quickly. Past the threshold, only the root starts expanded;
            // the rest is available on demand via toggle()/search, same as before.
            const paths =
                groups.length <= SubmodelTree.autoExpandThreshold
                    ? groups.map(g => g.path)
                    : groups.filter(g => g.level === 0).map(g => g.path);
            this.expanded.set(new Set(paths));
        });
    }

    /** Group-count threshold above which the tree starts collapsed (root only) instead of fully expanded. */
    private static readonly autoExpandThreshold = 150;

    /** The submodel to display. */
    public readonly submodel = input<aas.Submodel | undefined>(undefined);

    /** The AAS document the submodel belongs to (needed to resolve File element URLs). */
    public readonly document = input<AASDocument | undefined>(undefined);

    /**
     * Whether properties with an OPC UA nodeId should subscribe to live WebSocket updates and
     * show the broadcast icon. Defaults to true. Set to false for views (e.g. the generic
     * fallback) that should never treat an arbitrary submodel as a live data source, regardless
     * of whether its properties happen to carry a nodeId.
     */
    public readonly live = input<boolean>(true);

    public readonly expanded = signal<ReadonlySet<string>>(new Set());

    /** The committed search term that actually filters the tree -- see {@link queryDraft}. */
    public readonly query = signal('');

    /**
     * The search box's live text, updated on every keystroke. Kept separate from {@link query} (which
     * drives the actual filtering/re-render) so typing doesn't recompute and re-render a large tree once
     * per character -- {@link submitQuery} commits the draft to `query` on Enter instead.
     */
    public readonly queryDraft = signal('');

    private readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');

    public readonly groups = computed<SubmodelTreeGroup[]>(() => {
        this.map.clear();
        this.liveNodes = [];

        const submodel = this.submodel();
        if (!submodel?.submodelElements) {
            return [];
        }

        const groups: SubmodelTreeGroup[] = [];
        this.collect(submodel, 0, '', submodel.idShort, groups);
        return groups;
    });

    public rootGroup = computed(() => this.groups()[0]);

    public childGroups(path: string): SubmodelTreeGroup[] {
        return this.filtered().childrenByPath.get(path) ?? [];
    }

    public fileName(fileName: string | undefined): string | undefined {
        if (!fileName) return undefined;
        // Some backends store File.value as a base64url-encoded reference joined with '-'
        // rather than a conventional '/'-separated path (base64url never contains '/', so
        // splitting on '/' alone left the whole encoded string untouched) — split on both.
        const cutName = fileName.split(/[/-]/);
        return cutName[cutName.length - 1];
    }

    public isExpanded(path: string): boolean {
        const query = this.query().trim();
        if (query.length > 0) {
            // Force-expanding every matched group is convenient for a normal search result, but the
            // matched set can itself still be large enough to reproduce the same render blowup the
            // default-collapsed fix above prevents (e.g. searching a common term against a huge tree).
            // Past the same threshold, fall back to the actual expanded state instead -- search still
            // narrows what's shown via itemsOf()/childGroups(), it just stops auto-opening everything.
            if (this.filtered().visible.size <= SubmodelTree.autoExpandThreshold) {
                return true;
            }
        }

        return this.expanded().has(path);
    }

    public toggle(path: string): void {
        const next = new Set(this.expanded());
        next.has(path) ? next.delete(path) : next.add(path);
        this.expanded.set(next); // new Set, so the signal actually fires
    }

    /** Commits {@link queryDraft} to {@link query}, actually applying the search (Enter key handler). */
    public submitQuery(): void {
        this.query.set(this.queryDraft());
    }

    /** Clears both the search box and the applied search. */
    public clearQuery(): void {
        this.queryDraft.set('');
        this.query.set('');
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

        // Parent path -> its direct children, built once here instead of childGroups() re-scanning
        // every group on every call. childGroups() is invoked twice per rendered group from the
        // template (the item-count badge and the recursive @for), so that used to be an O(groups²)
        // scan -- unnoticeable for a handful of groups, but pegs the main thread for a large, deeply
        // nested submodel (e.g. a full ECLASS TechnicalData tree with hundreds of nested collections).
        const childrenByPath = new Map<string, SubmodelTreeGroup[]>();
        for (const group of this.groups()) {
            if (!visible.has(group.path)) {
                continue;
            }

            const separatorIndex = group.path.lastIndexOf('/');
            if (separatorIndex < 0) {
                continue; // a root group has no parent entry
            }

            const parentPath = group.path.slice(0, separatorIndex);
            const siblings = childrenByPath.get(parentPath);
            if (siblings) {
                siblings.push(group);
            } else {
                childrenByPath.set(parentPath, [group]);
            }
        }

        return { visible, itemsByPath, childrenByPath };
    });

    private collect(
        referable: aas.Referable,
        level: number,
        parentPath: string,
        segment: string,
        out: SubmodelTreeGroup[],
    ): void {
        const path = parentPath ? `${parentPath}/${segment}` : segment;
        const children = getChildren(referable);

        out.push({ ...this.createGroup(referable, children, segment), path, level });

        children.forEach((child, index) => {
            if ((isSubmodelElementCollection(child) || isSubmodelElementList(child)) && child.value) {
                // List items have no idShort at all (AAS spec), and some real-world exports also
                // repeat the same idShort across sibling collections (e.g. multiple "component
                // receptacle" entries) -- always fold in the index so paths stay unique either way.
                this.collect(child, level + 1, path, `${index}:${child.idShort ?? ''}`, out);
            }
        });
    }

    private createGroup(
        parent: aas.Referable,
        children: aas.Referable[],
        segment: string,
    ): Omit<SubmodelTreeGroup, 'path' | 'level'> {
        const currentLang = this.currentLang();
        const document = this.document();
        const env = document?.content;
        const items: SubmodelTreeItem[] = [];

        const push = (
            child: aas.SubmodelElement,
            type: SubmodelTreeItem['type'],
            value: string | undefined,
            url?: string,
            isProse?: boolean
        ): SubmodelTreeItem => {
            const item: SubmodelTreeItem = {
                idShort: child.idShort,
                name: getDisplayName(child, env, currentLang),
                typeAbbreviation: getAbbreviation(child.modelType),
                description: getElementDescription(child),
                value: signal(value),
                type,
                element: child,
                url,
                unit: env ? getUnit(env, child) : undefined,
                isProse,
            };

            items.push(item);
            return item;
        };

        for (const child of children) {
            // SubmodelElementCollection/List are rendered as their own nested group (see
            // collect()/groups()), not as a leaf item here.
            if (isSubmodelElementCollection(child) || isSubmodelElementList(child)) {
                continue;
            }

            if (isProperty(child)) {
                const item = push(child, 'text', child.value);
                if (this.live() && child.nodeId) {
                    this.liveNodes.push({ nodeId: child.nodeId, valueType: child.valueType ?? 'undefined' });
                    this.map.set(child.nodeId, item);
                    item.isOnline = true;
                }
            } else if (isMultiLanguageProperty(child)) {
                if (!child.value || child.value.length === 0) {
                    continue;
                }
                
                push(child, 'text', getLocaleValue(child.value, currentLang), undefined, true);
            } else if (isFile(child)) {
                if (!child.value || !document) {
                    continue;
                }

                push(child, 'link', child.value, getUrl(document, child));
            } else if (isRange(child)) {
                if (child.min === undefined && child.max === undefined) {
                    continue;
                }

                push(child, 'text', `${child.min ?? '?'} … ${child.max ?? '?'}`);
            } else if (isReferenceElement(child)) {
                push(child, 'text', child.value ? referenceToString(child.value) : undefined);
            } else if (isAnnotatedRelationshipElement(child) || isRelationshipElement(child)) {
                const value =
                    child.first && child.second
                        ? `${referenceToString(child.first)} → ${referenceToString(child.second)}`
                        : undefined;
                push(child, 'text', value);
            } else if (isEntity(child)) {
                push(child, 'text', child.entityType);
            } else if (isBasicEventElement(child)) {
                push(child, 'text', child.direction);
            } else {
                // Blob, Operation, Capability, and any future element type this component
                // doesn't have dedicated value-rendering for — still shown, just without a
                // single inline value (its description, e.g. Blob's content type, still shows).
                push(child, 'none', undefined);
            }
        }

        // parent.idShort is undefined for a SubmodelElementList item (AAS spec) -- getDisplayName()'s
        // idShort fallback requires a string, so give it a synthetic one (just the sibling index,
        // not the full "index:idShort" path segment). displayName, if present, still wins either way.
        const idShort = parent.idShort ?? segment.split(':', 1)[0];
        return {
            idShort,
            name: getDisplayName(parent.idShort ? parent : { ...parent, idShort }, null, currentLang),
            typeAbbreviation: getAbbreviation(parent.modelType),
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
