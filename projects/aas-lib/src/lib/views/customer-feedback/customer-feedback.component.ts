/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { EMPTY, first, from, mergeMap, Observable, of, Subscription, toArray } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    computed,
    effect,
    signal,
    viewChild,
} from '@angular/core';

import { aas, getLocaleValue, getPreferredName } from 'aas-core';
import { ScoreComponent } from '../../components/score/score.component';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { CustomerFeedbackStore, FeedbackItem, GeneralItem } from './customer-feedback.store';
import { decodeBase64Url, encodeBase64Url, hashCode } from '../../utilities';
import { DocumentsService } from '../../services/documents.service';

const maxStars = 5;

@Component({
    selector: 'fhg-customer-feedback',
    templateUrl: './customer-feedback.component.html',
    styleUrls: ['./customer-feedback.component.scss'],
    imports: [ScoreComponent, DecimalPipe, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFeedbackComponent implements OnInit, OnDestroy {
    private readonly map = new Map<string, GeneralItem>();
    private readonly subscription = new Subscription();
    private readonly stars$ = signal(0.0);
    private readonly count$ = signal(0);
    private readonly items$ = signal<GeneralItem[]>([]);
    private readonly feedbacks$ = signal<FeedbackItem[]>([]);
    private readonly starClassNames$ = signal<string[]>([]);

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly translate: TranslateService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        private readonly store: CustomerFeedbackStore,
        private readonly api: DocumentsService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            this.initialize(this.store.submodels());
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('customerFeedbackToolbar');

    public readonly name = computed(() => {
        const submodels = this.store.submodels();
        if (!submodels) {
            return '';
        }

        const names = submodels.map(
            ([env, submodel]) =>
                getLocaleValue(getPreferredName(env, submodel), this.translate.currentLang) ?? submodel.idShort,
        );

        if (names.length <= 2) {
            return names.join(', ');
        }

        return `${names[0]}, ..., ${names[names.length - 1]} (${names.length})`;
    });

    public readonly stars = this.stars$.asReadonly();

    public readonly overallRating = this.count$.asReadonly();

    public readonly items = this.items$.asReadonly();

    public readonly feedbacks = this.feedbacks$.asReadonly();

    public readonly starClassNames = this.starClassNames$.asReadonly();

    public ngOnInit(): void {
        this.route.queryParams
            .pipe(
                first(),
                mergeMap(params => {
                    if (params.id) {
                        const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
                        return this.api.getDocument(decodeBase64Url(params.id), endpoint).pipe(toArray());
                    }

                    if (!params.docs) {
                        return of([]);
                    }

                    const docs: [string, string][] = JSON.parse(decodeBase64Url(params.docs));
                    return from(docs).pipe(
                        mergeMap(([endpoint, id]) => this.api.getDocument(id, endpoint)),
                        toArray(),
                    );
                }),
            )
            .subscribe(documents => {
                if (documents.length > 0) {
                    this.store.documents.set(documents);
                } else {
                    this.initialize(this.store.submodels());
                }
            });

        this.subscription.add(
            this.translate.onLangChange.subscribe(() => {
                this.initialize(this.store.submodels());
            }),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        const documents = this.store.documents();
        if (documents.length === 0) {
            return EMPTY;
        }

        let href: string;
        if (documents.length === 1) {
            href = `/view/CustomerFeedback?endpoint=${encodeBase64Url(documents[0].endpoint)}&id=${encodeBase64Url(documents[0].id)}`;
        } else {
            href = `/view/CustomerFeedback?docs=${encodeBase64Url(JSON.stringify(documents.map(document => [document.endpoint, document.id])))}`;
        }

        const inputs: Record<string, unknown> = {
            count: documents.length,
            stars: this.stars(),
            overallRating: this.overallRating(),
            items: this.items$(),
            starClassNames: this.starClassNames(),
            href,
        };

        const hc = hashCode(documents.map(item => `${item.endpoint}#${item.id}`).join());
        if (!this.start.add('CustomerFeedback', `CustomerFeedback#${hc}`, inputs)) {
            return EMPTY;
        }

        return this.start.save();
    }

    private initialize(submodels: [aas.Environment, aas.Submodel][]): void {
        this.map.clear();
        let count = 0;
        let stars = 0.0;
        const items: GeneralItem[] = [];
        const feedbacks: FeedbackItem[] = [];
        let sumStars = 0;

        for (const [, submodel] of submodels) {
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

        this.stars$.set(stars);
        this.count$.set(count);
        this.starClassNames$.set(this.initStarClassNames(stars));
        this.items$.set(items.filter(item => item.count > 0));
        this.feedbacks$.set(feedbacks);
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
            return date.toLocaleDateString(this.translate.currentLang);
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
