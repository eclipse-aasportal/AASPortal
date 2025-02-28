/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, computed, input, signal } from '@angular/core';

import { CultureInfo } from './culture-info';
import { WINDOW } from '../window.service';

@Component({
    selector: 'fhg-localize',
    templateUrl: './localize.component.html',
    styleUrls: ['./localize.component.scss'],
    imports: [NgbModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizeComponent implements OnInit, OnDestroy {
    private readonly subscription = new Subscription();
    private readonly _culture = signal<CultureInfo | null>(null);

    public constructor(
        private readonly translate: TranslateService,
        @Inject(WINDOW) private readonly window: Window,
    ) {}

    public readonly languages = input<string[]>(['en-us']);

    public readonly cultures = computed(() => {
        return this.languages().map(
            lang =>
                ({
                    localeId: lang,
                    name: new Intl.DisplayNames([lang], { type: 'language' }).of(lang),
                }) as CultureInfo,
        );
    });

    public readonly culture = this._culture.asReadonly();

    public setCulture(value: CultureInfo): void {
        this.translate.use(value.localeId);
        this.window.localStorage.setItem('.localeId', value.localeId);
    }

    public ngOnInit(): void {
        this.subscription.add(this.translate.onLangChange.subscribe(this.onLangChange));
        const localeId = this.window.localStorage.getItem('.localeId');
        if (localeId && this.translate.currentLang !== localeId) {
            this.translate.use(localeId);
        }

        if (!this.translate.currentLang) {
            this.translate.use(this.translate.defaultLang);
        }
    }

    public ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private onLangChange = (value: LangChangeEvent): void => {
        const item = this.findCulture(this.cultures(), value.lang);
        if (item) {
            this._culture.set(item);
        }
    };

    private findCulture(cultures: CultureInfo[], localeId: string): CultureInfo | undefined {
        localeId = localeId?.toLocaleLowerCase();
        return cultures.find(item => item.localeId.toLocaleLowerCase() === localeId);
    }
}
