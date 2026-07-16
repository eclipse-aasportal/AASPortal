/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LeafView } from '../leaf-view';
import { ToolbarService } from '../../share/services/toolbar.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { encodeBase64Url, toString } from '../../utilities';
import { StartService } from '../../services/start.service';
import { RouterLink } from '@angular/router';
import { VIEW_ROUTE_NAME } from '../view-route-name';

@Component({
    selector: 'fhg-service-request-notification',
    imports: [ThumbnailQRCode, RouterLink],
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'ServiceRequestNotification' }],
    templateUrl: './service-request-notification.html',
    styleUrl: './service-request-notification.scss',
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

    public readonly requestId = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ServiceRequestNotificationId', this.currentLang());
    });

    public readonly shortText = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ShortText', this.currentLang());
    });

    public readonly status = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'Status', this.currentLang());
    });

    public readonly priority = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'Priority', this.currentLang());
    });

    public readonly detailedInformation = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'DetailedInformation.LongText', this.currentLang());
    });

    public readonly ReportedByNumber = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ReportedBy.CustomerNumber', this.currentLang());
    });

    public readonly ReportedByName = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ReportedBy.ContactInformation.NameOfContact', this.currentLang());
    });

    public readonly ReportedByDepartment = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ReportedBy.ContactInformation.Department', this.currentLang());
    });

    public readonly ReportedByEmail = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ReportedBy.ContactInformation.Email', this.currentLang());
    });

    public readonly ReportedByPhone = computed(() => {
        const submodel = this.submodel();
        if (submodel === undefined) {
            return '-';
        }

        return toString(submodel, 'ReportedBy.ContactInformation.Phone', this.currentLang());
    });
}
