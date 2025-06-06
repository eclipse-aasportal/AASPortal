/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
    WritableSignal,
} from '@angular/core';
import QRCode from 'qrcode';
import { ActivatedRoute } from '@angular/router';
import {
    aas,
    AASDocument,
    convertToString,
    getLocaleValue,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    LiveNode,
    LiveRequest,
    WebSocketData,
} from 'aas-core';

import { decodeBase64Url, encodeBase64Url, getDisplayName, getUrl } from '../../utilities';
import { WINDOW } from '../../services/window.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, first, mergeMap, Observable } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';
import { DocumentsService } from '../../services/documents.service';
import { ToolbarService } from '../../services/toolbar.service';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketFactoryService } from '../../services/web-socket-factory.service';

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
    selector: 'fhg-laser',
    templateUrl: './laser.component.html',
    styleUrl: './laser.component.scss',
    imports: [NgbAccordionModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaserComponent implements OnInit, OnDestroy {
    private readonly document = signal<AASDocument | undefined>(undefined);
    private readonly map = new Map<string, GroupItem>();
    private liveNodes: LiveNode[] = [];
    private webSocketSubject?: WebSocketSubject<WebSocketData>;

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly translate: TranslateService,
        private readonly toolbar: ToolbarService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
        private readonly api: DocumentsService,
        private readonly webSocketFactory: WebSocketFactoryService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            const qrCode = this.qrCode();
            const url = new URL(this.window.location.toString());
            const document = this.document();
            if (document) {
                url.searchParams.set('endpoint', encodeBase64Url(document.endpoint));
                url.searchParams.set('id', encodeBase64Url(document.id));
            }

            if (qrCode) {
                QRCode.toCanvas(qrCode.nativeElement, url.toString());
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

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('laserToolbar');

    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    public readonly title = computed(() => {
        const env = this.document()?.content;
        if (!env || env.assetAdministrationShells.length === 0) {
            return '-';
        }

        return getDisplayName(env.assetAdministrationShells[0], env, this.translate.currentLang);
    });

    public readonly thumbnail = signal<string>('/assets/resources/cunalaserinalogo.gif').asReadonly();

    public readonly groups = computed<Group[]>(() => {
        this.map.clear();
        this.liveNodes = [];
        const content = this.document()?.content;
        if (!content) {
            return [];
        }

        const groups: Group[] = [];
        for (const submodel of content.submodels) {
            const submodelElements = submodel.submodelElements;
            if (!submodelElements) {
                continue;
            }

            const group = this.createGroup(submodel, submodel, submodelElements);
            if (group.items.length > 0) {
                groups.push(group);
            }

            for (const element of submodelElements) {
                if (isSubmodelElementCollection(element) && element.value) {
                    const group = this.createGroup(submodel, element, element.value);
                    if (group.items.length > 0) {
                        groups.push(group);
                    }
                }
            }
        }

        return groups;
    });

    public ngOnInit(): void {
        this.route.queryParams
            .pipe(
                first(),
                mergeMap(params => {
                    if (params.id) {
                        const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
                        return this.api.getDocument(decodeBase64Url(params.id), endpoint);
                    }

                    return EMPTY;
                }),
            )
            .subscribe(document => {
                this.document.set(document);
            });
    }

    public ngOnDestroy(): void {
        this.webSocketSubject?.unsubscribe();
        this.toolbar.clear();
    }

    public open($event: MouseEvent, item: GroupItem): void {
        if (item.url) {
            const token = this.auth.token();
            this.window.open(item.url + '?access_token=' + token);
        }

        $event.stopPropagation();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }

    private createGroup(submodel: aas.Submodel, parent: aas.Referable, children: aas.Referable[]): Group {
        const env = this.document()?.content;
        const items: GroupItem[] = [];
        for (const child of children) {
            if (isProperty(child)) {
                const item: GroupItem = {
                    idShort: child.idShort,
                    name: getDisplayName(child, env, this.translate.currentLang),
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
                    name: getDisplayName(child, env, this.translate.currentLang),
                    value: signal(getLocaleValue(child.value, this.translate.currentLang)),
                    type: 'text',
                    element: child,
                });
            } else if (isFile(child)) {
                if (!child.value) {
                    continue;
                }

                items.push({
                    idShort: child.idShort,
                    name: getDisplayName(child, env, this.translate.currentLang),
                    value: signal(child.value),
                    type: 'link',
                    element: child,
                    url: getUrl(this.document()!, submodel, child),
                });
            }
        }

        return {
            idShort: parent.idShort,
            name: getDisplayName(parent, null, this.translate.currentLang),
            items,
        };
    }

    private play(): void {
        const document = this.document();
        if (!document) {
            return;
        }

        this.webSocketSubject = this.webSocketFactory.create();
        this.webSocketSubject.subscribe({
            next: this.onMessage,
            error: this.onError,
        });

        this.webSocketSubject.next(this.createMessage(document));
    }

    private stop(): void {
        if (this.webSocketSubject) {
            this.webSocketSubject.unsubscribe();
            this.webSocketSubject = undefined;
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

                item.value.set(convertToString(node.value, this.translate.currentLang));
            }
        }
    };

    private onError = (error: unknown): void => {
        console.error(error);
    };
}
