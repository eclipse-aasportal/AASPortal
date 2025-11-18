/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateDirective } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    OnDestroy,
    OnInit,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { ContactInformation } from './contact-information';
import { VIEW_ROUTES } from '../../views/views-routes';
import { ContactInformationViewState } from './contact-information-view.state';
import { LeafView } from '../leaf-view';
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';

/**
 * Provides a view for contact information submodels.
 */
@Component({
    selector: 'fhg-contact-information-view',
    templateUrl: './contact-information-view.html',
    styleUrls: ['./contact-information-view.scss'],
    imports: [TranslateDirective, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, ContactInformation],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformationView extends LeafView<ContactInformationViewState> implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

    /**
     * Creates a new instance of the ContactInformationView.
     */
    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'ContactInformation',
            inject(ContactInformationViewState),
        );

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    /**
     * Template reference for the toolbar.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<ContactInformationView>>('toolbar');

    /**
     * Exposes the current state of the contact information section.
     */
    public readonly contactInformationState = this.state.contactInformationState;

    public ngOnInit(): void {
        this.onInit();
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
        const href = `/views/ContactInformation;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `CIV#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
