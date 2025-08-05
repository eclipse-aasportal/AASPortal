/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    Inject,
    OnDestroy,
    OnInit,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { ContactInformation } from './contact-information';
import { LeafView } from '../view-leaf';
import { VIEW_ROUTES, ViewRoute } from '../../types';

@Component({
    selector: 'fhg-contact-information-view',
    templateUrl: './contact-information.view.html',
    styleUrls: ['./contact-information.view.scss'],
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, ContactInformation],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformationView extends LeafView implements OnInit, OnDestroy {
    public constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        @Inject(VIEW_ROUTES) viewRoutes: ViewRoute[],
        private readonly toolbar: ToolbarService,
    ) {
        super(route, api, viewRoutes, 'ContactInformation');

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<ContactInformationView>>('toolbar');

    public ngOnInit(): void {
        this.onInit();
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }
}
