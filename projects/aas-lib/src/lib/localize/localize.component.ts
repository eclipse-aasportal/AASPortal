/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { CultureInfo } from './culture-info';
import { WindowService } from '../window.service';

@Component({
    selector: 'fhg-localize',
    templateUrl: './localize.component.html',
    styleUrls: ['./localize.component.scss'],
})
export class LocalizeComponent implements OnInit, OnChanges, OnDestroy {
    private readonly subscription = new Subscription();
    private readonly _cultures = new BehaviorSubject<CultureInfo[]>([]);
    private readonly _culture = new BehaviorSubject<CultureInfo | undefined>(undefined);

    public constructor(
        private readonly translate: TranslateService,
        private readonly window: WindowService,
    ) {
        this.cultures = this._cultures.asObservable();
        this.culture = this._culture.asObservable();
    }

    @Input()
    public languages: string[] = ['en-us'];

    public readonly cultures: Observable<CultureInfo[]>;

    public readonly culture: Observable<CultureInfo | undefined>;

    public setCulture(value: CultureInfo): void {
        this.translate.use(value.localeId);
        this.window.setLocalStorageItem('.localeId', value.localeId);
    }

    public ngOnInit(): void {
        this.subscription.add(this.translate.onLangChange.subscribe(this.onLangChange));
        const localeId = this.window.getLocalStorageItem('.localeId');
        if (localeId && this.translate.currentLang !== localeId) {
            this.translate.use(localeId);
        }

        if (!this.translate.currentLang) {
            this.translate.use(this.translate.defaultLang);
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['languages']) {
            const items = this.languages.map(
                lang =>
                    ({
                        localeId: lang,
                        name: new Intl.DisplayNames([lang], { type: 'language' }).of(lang),
                    }) as CultureInfo,
            );

            const current =
                this.findCulture(items, this.translate.currentLang) ??
                this.findCulture(items, this.translate.defaultLang) ??
                items[0];

            this._cultures.next(items);
            this._culture.next(current);
        }
    }

    public ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private onLangChange = (value: LangChangeEvent): void => {
        const item = this.findCulture(this._cultures.value, value.lang);
        if (item) {
            this._culture.next(item);
        }
    };

    private findCulture(cultures: CultureInfo[], localeId: string): CultureInfo | undefined {
        localeId = localeId?.toLocaleLowerCase();
        return cultures.find(item => item.localeId.toLocaleLowerCase() === localeId);
    }
}