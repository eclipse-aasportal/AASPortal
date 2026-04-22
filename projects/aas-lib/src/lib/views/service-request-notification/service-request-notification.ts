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

@Component({
    selector: 'fhg-service-request-notification',
    imports: [ThumbnailQRCode, RouterLink],
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'ServiceRequestNotification' }],
    templateUrl: './service-request-notification.html',
    styleUrl: './service-request-notification.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceRequestNotification extends LeafView implements OnDestroy {
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

    public readonly items = computed(() => {
        const submodel = this.submodel();
        if (!submodel?.submodelElements) {
            return [];
        }

        return submodel.submodelElements;
    });

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
        const href = `/views/ServiceRequestNotification;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `SRN#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
