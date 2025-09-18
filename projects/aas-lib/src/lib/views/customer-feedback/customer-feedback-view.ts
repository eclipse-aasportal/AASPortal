/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    Signal,
    TemplateRef,
    computed,
    effect,
    inject,
    viewChild,
} from '@angular/core';

import { aas, AASDocument } from 'aas-core';
import { ScoreComponent } from '../../components/score/score.component';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { encodeBase64Url, getDisplayName, hashCode } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { FeedbackItem, GeneralItem } from './customer-feedback.types';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTES } from '../../types';
import { CustomerFeedbackViewState } from './customer-feedback-view.state';

const maxStars = 5;

@Component({
    selector: 'fhg-customer-feedback',
    templateUrl: './customer-feedback-view.html',
    styleUrls: ['./customer-feedback-view.scss'],
    imports: [ScoreComponent, DecimalPipe, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFeedbackView extends LeafView<CustomerFeedbackViewState> implements OnInit, OnDestroy {
    private readonly map = new Map<string, GeneralItem>();
    private readonly subscription = new Subscription();
    private readonly currentLang: Signal<string>;
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly translate = inject(TranslateService);

    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'CustomerFeedback',
            inject(CustomerFeedbackViewState),
        );

        const langChange = toSignal(this.translate.onLangChange);
        this.currentLang = computed(() => langChange()?.lang ?? this.translate.getCurrentLang());

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            this.initialize(this.tuples());
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('customerFeedbackToolbar');

    public readonly name = computed(() => {
        const tuples = this.tuples();
        if (!tuples) {
            return undefined;
        }

        const names = tuples.map(([document, submodel]) =>
            getDisplayName(submodel, document.content, this.currentLang()),
        );

        if (names.length <= 2) {
            return names.join(', ');
        }

        return `${names[0]}, ..., ${names[names.length - 1]} (${names.length})`;
    });

    public readonly stars = this.state.stars;

    public readonly overallRating = this.state.count;

    public readonly items = this.state.items;

    public readonly feedbacks = this.state.feedbacks;

    public readonly starClassNames = this.state.starClassNames;

    public ngOnInit(): void {
        this.onInit();
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        const documents = this.tuples().map(([document]) => document);
        if (documents.length === 0) {
            return EMPTY;
        }

        let href: string;
        if (documents.length === 1) {
            href = `/view/CustomerFeedback;endpoint=${encodeBase64Url(documents[0].endpoint)};id=${encodeBase64Url(documents[0].id)}`;
        } else {
            href = `/view/CustomerFeedback;docs=${encodeBase64Url(JSON.stringify(documents.map(document => [document.endpoint, document.id])))}`;
        }

        const inputs: Record<string, unknown> = {
            count: documents.length,
            stars: this.stars(),
            overallRating: this.overallRating(),
            items: this.items(),
            starClassNames: this.starClassNames(),
            href,
        };

        const hc = hashCode(documents.map(item => `${item.endpoint}#${item.id}`).join());
        if (!this.start.add('CustomerFeedback', `CustomerFeedback#${hc}`, inputs)) {
            return EMPTY;
        }

        return this.start.save();
    }

    private initialize(tuples: [AASDocument, aas.Submodel][]): void {
        this.map.clear();
        let count = 0;
        let stars = 0.0;
        const items: GeneralItem[] = [];
        const feedbacks: FeedbackItem[] = [];
        let sumStars = 0;

        for (const [, submodel] of tuples) {
            if (submodel.submodelElements) {
                for (const feedback of submodel.submodelElements.filter(
                    item => item.modelType === 'SubmodelElementCollection',
                )) {
                    const general = (feedback as aas.SubmodelElementCollection).value?.find(
                        item => item.modelType === 'SubmodelElementCollection' && item.idShort === 'General',
                    );

                    if (general) {
                        sumStars += this.getStars(feedback);
                        this.buildItems(general, items);
                        ++count;
                    }

                    feedbacks.push({
                        stars: this.initStarClassNames(this.getStars(feedback)),
                        createdAt: this.getCreatedAt(feedback),
                        subject: submodel.idShort,
                        message: this.getMessage(feedback),
                    });
                }
            }
        }

        if (count > 0) {
            stars = sumStars / count;
            items.forEach(item => {
                item.score = item.sum / item.count;
                item.like = item.score >= 0.0;
            });
        }

        this.state.update({
            stars,
            count,
            starClassNames: this.initStarClassNames(stars),
            items: items.filter(item => item.count > 0),
            feedbacks,
        });
    }

    private buildItems(general: aas.SubmodelElementCollection, items: GeneralItem[]): void {
        if (general.value) {
            for (const element of general.value.filter(child => child.modelType === 'SubmodelElementCollection')) {
                let item = this.map.get(element.idShort);
                if (!item) {
                    item = { name: this.getName(element), score: 0, sum: 0.0, count: 0, like: false };

                    this.map.set(element.idShort, item);
                    items.push(item);
                }

                const score = this.getScore(element);
                if (!Number.isNaN(score)) {
                    ++item.count;
                    item.sum += score;
                }
            }
        }
    }

    private getScore(element: aas.Referable): number {
        let score = this.toNumber(this.findProperty(element, 'Score')?.value);
        if (!score && !this.findProperty(element, 'Sentiment')?.value) {
            score = Number.NaN;
        }

        return score;
    }

    private getStars(element: aas.Referable): number {
        const property = this.findProperty(element, 'stars');
        return property ? this.toNumber(property.value) : 0.0;
    }

    private getMessage(element: aas.Referable): string {
        const property = this.findProperty(element, 'message');
        return property ? String(property.value) : '-';
    }

    private getCreatedAt(element: aas.Referable): string {
        const property = this.findProperty(element, 'createdAt');
        if (property) {
            const date = new Date(String(property.value));
            return date.toLocaleDateString(this.currentLang());
        }

        return '-';
    }

    private initStarClassNames(stars: number): string[] {
        const starClassNames: string[] = [];
        for (let i = 0; i < maxStars; i++) {
            let className: string;
            const n = stars - i;
            if (n > 0.0) {
                className = n >= 1.0 ? 'bi bi-star-fill' : 'bi-star-half';
            } else {
                className = 'bi bi-star';
            }

            starClassNames.push(className);
        }

        return starClassNames;
    }

    private getName(element: aas.Referable): string {
        return this.translate.instant(`CustomerFeedback.${element.idShort}`);
    }

    private findProperty(element: aas.SubmodelElementCollection, name: string): aas.Property | undefined {
        return element.value?.find(child => child.modelType === 'Property' && child.idShort === name) as aas.Property;
    }

    private toNumber(s: string | undefined): number {
        return s ? Number(s.replace(',', '.')) : NaN;
    }
}
