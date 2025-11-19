import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, Signal, signal, TemplateRef, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { aas, getChildren, isSubmodelElementCollection, isSubmodelElementList, isProperty, isMultiLanguageProperty, getLocaleValue, isFile, AASDocument, WebSocketData, LiveRequest, LiveNode, convertToString } from 'projects/aas-core';
import { Observable, EMPTY } from 'rxjs';
import { getDisplayName, getUrl } from '../../utilities';
import { GroupItem, Group } from '../operational-data/operational-data-view';
import { VIEW_ROUTES } from '../views-routes';
import { GenericSubmodelViewState } from './generic-submodel.state';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { OperationalDataViewState } from '../operational-data/operational-data-view.state';
import { LeafView } from '../leaf-view';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';

@Component({
  selector: 'fhg-generic-submodel',
  imports: [NgbAccordionModule, ThumbnailQRCode, TranslateDirective, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './generic-submodel.component.html',
  styleUrl: './generic-submodel.component.scss',
})
export class GenericSubmodelComponent extends LeafView<GenericSubmodelViewState> implements OnInit, OnDestroy {
private readonly map = new Map<string, GroupItem>();
    private readonly toolbar = inject(ToolbarService);
    private readonly currentLang: Signal<string>;

    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'GenericSubmodel',
            inject(GenericSubmodelViewState),
        );

        const translate = inject(TranslateService);
        const langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => langChange()?.lang ?? translate.getCurrentLang());

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            this.groups();
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('laserToolbar');

    public readonly groups = computed<Group[]>(() => {
        this.map.clear();

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

    public ngOnInit(): void {
        this.onInit();
    }

    public ngOnDestroy(): void {
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

}
