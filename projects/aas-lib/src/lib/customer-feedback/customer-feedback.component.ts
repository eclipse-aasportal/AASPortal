/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DecimalPipe, Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { aas, AASDocument, getLocaleValue, getPreferredName, isReference } from 'aas-core';
import { ScoreComponent } from '../score/score.component';

export interface GeneralItem {
    name: string;
    score: number;
    sum: number;
    count: number;
    like: boolean;
}

export interface FeedbackItem {
    stars: string[];
    createdAt: string;
    subject: string;
    message: string;
}
const CustomerFeedback = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback';

@Component({
    selector: 'fhg-customer-feedback',
    templateUrl: './customer-feedback.component.html',
    styleUrls: ['./customer-feedback.component.scss'],
    imports: [ScoreComponent, DecimalPipe, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFeedbackComponent implements OnInit, OnDestroy {
    private static readonly maxStars = 5;
    private readonly map = new Map<string, GeneralItem>();
    private readonly subscription = new Subscription();
    private readonly submodels = signal<[aas.Environment, aas.Submodel][]>([]);

    public constructor(
        private readonly location: Location,
        private readonly translate: TranslateService,
    ) {
        effect(() => {
            this.init(this.submodels());
        });
    }

    public readonly name = computed(() => {
        const submodels = this.submodels();
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

    public readonly stars = signal(0.0);
    public readonly count = signal(0);
    public readonly items = signal<GeneralItem[]>([]);
    public readonly feedbacks = signal<FeedbackItem[]>([]);
    public readonly starClassNames = signal<string[]>([]);

    public ngOnInit(): void {
        const state = this.location.getState() as Record<string, string>;
        if (state.data) {
            const documents: AASDocument[] = JSON.parse(state.data);
            this.submodels.set([...this.filterSubmodels(documents)]);
        }

        this.subscription.add(
            this.translate.onLangChange.subscribe(() => {
                this.init(this.submodels());
            }),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private init(submodels: [aas.Environment, aas.Submodel][]): void {
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

        this.stars.set(stars);
        this.count.set(count);
        this.starClassNames.set(this.initStarClassNames(stars));
        this.items.set(items.filter(item => item.count > 0));
        this.feedbacks.set(feedbacks);
    }

    private *filterSubmodels(documents: AASDocument[]): Generator<[aas.Environment, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = this.getSemanticId(submodel);
                if (semanticId === CustomerFeedback) {
                    yield [document.content, submodel];
                }
            }
        }
    }

    private getSemanticId(value: aas.HasSemantics | aas.Reference): string | undefined {
        let semanticId: string | undefined;
        if (value) {
            if (isReference(value)) {
                if (value.keys.length > 0) {
                    return value.keys[0].value;
                }
            } else {
                if (value.semanticId?.keys != null && value.semanticId.keys.length > 0) {
                    return value.semanticId.keys[0].value;
                }
            }
        }

        return semanticId;
    }

    private buildItems(general: aas.SubmodelElementCollection, items: GeneralItem[]): void {
        if (general.value) {
            for (const element of general.value.filter(child => child.modelType === 'SubmodelElementCollection')) {
                let item = this.map.get(element.idShort);
                if (!item) {
                    item = {
                        name: this.getName(element),
                        score: 0,
                        sum: 0.0,
                        count: 0,
                        like: false,
                    };

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
        for (let i = 0; i < CustomerFeedbackComponent.maxStars; i++) {
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
