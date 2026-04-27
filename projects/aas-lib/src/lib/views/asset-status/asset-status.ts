/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnDestroy,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { LeafView } from '../leaf-view';
import { ToolbarService } from '../../services/toolbar.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { encodeBase64Url } from '../../utilities';
import { StartService } from '../../services/start.service';
import { RouterLink } from '@angular/router';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { aas, isProperty, isSubmodelElementCollection, isSubmodelElementList } from 'aas-core';

@Component({
    selector: 'fhg-asset-status',
    imports: [ThumbnailQRCode, RouterLink],
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'AssetStatus' }],
    templateUrl: './asset-status.html',
    styleUrl: './asset-status.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetStatus extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    /** ToDo */
    public readonly items = computed(() => {
        const submodel = this.submodel();
        if (!submodel?.submodelElements) {
            return [];
        }

        return submodel.submodelElements;
    });

    public statusBorderClass(value: string): string {
        const v = value.toLowerCase();
        if (v === 'running') return 'border-success border-2';
        if (v === 'fault') return 'border-danger border-2';
        return 'border-warning border-2';
    }

    public statusTextClass(value: string): string {
        const v = value.toLowerCase();
        if (v === 'running') return 'text-success';
        if (v === 'fault') return 'text-danger';
        return 'text-status-unknown';
    }

    public checkCategory(category: string): Boolean {
        const items = this.items();
        const collection = items.find(
            (element): element is aas.SubmodelElementCollection =>
                isSubmodelElementList(element) && element.idShort.toLowerCase() === category.toLowerCase(),
        );
        return collection ? true : false 
    }

    public getStatusValue(category: string, valueName: string): string {
        const items = this.items();
        const collection = items.find(
            (element): element is aas.SubmodelElementCollection =>
                isSubmodelElementList(element) && element.idShort.toLowerCase() === category.toLowerCase(),
        );
        if (!collection) return '-';

        const last = collection.value?.[collection.value.length - 1];
        if (!isSubmodelElementCollection(last)) return '-';

        const prop = last.value?.find(
            (element): element is aas.Property =>
                isProperty(element) && element.idShort.toLowerCase() === valueName.toLowerCase(),
        );

        return prop?.value ?? '-1';
    }


    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        const document = this.document();
        if (document === undefined) {
            return of(void 0);
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/views/AssetStatus;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `AST#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
