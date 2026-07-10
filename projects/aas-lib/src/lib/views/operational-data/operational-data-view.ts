/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, Subscription } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnDestroy,
    Signal,
    signal,
    TemplateRef,
    viewChild,
    WritableSignal,
} from '@angular/core';

import {
    aas,
    AASDocument,
    convertToString,
    getChildren,
    getLocaleValue,
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
import { ToolbarService } from '../../services/toolbar.service';
import { WebSocketService } from '../../services/web-socket.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { LeafView } from '../leaf-view';
import { OperationalDataViewState } from './operational-data-view.state';
import { VIEW_ROUTE_NAME } from '../view-route-name';

export type GroupItem = {
    idShort: string;
    name: string;
    value: WritableSignal<string | undefined>;
    type: 'text' | 'link';
    element: aas.SubmodelElement;
    url?: string;
    isOnline?: boolean;
};

export type Group = { idShort: string; name: string; items: GroupItem[] };

@Component({
    selector: 'fhg-operational-data-view',
    templateUrl: './operational-data-view.html',
    styleUrl: './operational-data-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'OperationalData' }],
    imports: [NgbAccordionModule, ThumbnailQRCode, TranslateDirective, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationalDataView extends LeafView implements OnDestroy {
    private readonly map = new Map<string, GroupItem>();
    private readonly toolbar = inject(ToolbarService);
    private readonly webSocket = inject(WebSocketService);
    private readonly state = inject(OperationalDataViewState);
    private liveNodes: LiveNode[] = [];
    private webSocketSubscription?: Subscription;

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            this.groups();
            this.stop();
            if (this.liveNodes.length > 0) {
                this.play();
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly groups = computed<Group[]>(() => {
        this.map.clear();
        this.liveNodes = [];

        const operationalData = this.submodel();
        if (!operationalData?.submodelElements) {
            return [];
        }

        const groups: Group[] = [];
        const stack: aas.Referable[] = [];
        stack.push(operationalData);
        while (stack.length > 0) {
            const referable = stack.pop()!;
            groups.push(this.createGroup(referable, getChildren(referable)));
            for (const child of getChildren(referable)) {
                if ((isSubmodelElementCollection(child) || isSubmodelElementList(child)) && child.value) {
                    stack.push(child);
                }
            }
        }

        return groups;
    });

    public ngOnDestroy(): void {
        this.webSocketSubscription?.unsubscribe();
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }

    private createGroup(parent: aas.Referable, children: aas.Referable[]): Group {
        const currentLang = this.currentLang();
        const env = this.document()?.content;
        const items: GroupItem[] = [];
        for (const child of children) {
            if (isProperty(child)) {
                const item: GroupItem = {
                    idShort: child.idShort,
                    name: getDisplayName(child, env, currentLang),
                    value: signal(child.value),
                    type: 'text',
                    element: child,
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
                });
            } else if (isFile(child)) {
                if (!child.value) {
                    continue;
                }

                items.push({
                    idShort: child.idShort,
                    name: getDisplayName(child, env, currentLang),
                    value: signal(child.value),
                    type: 'link',
                    element: child,
                    url: getUrl(this.document()!, child),
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
