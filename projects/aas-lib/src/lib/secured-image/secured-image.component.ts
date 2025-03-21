/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, first, map, mergeMap, skipWhile, switchMap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'fhg-img',
    templateUrl: './secured-image.component.html',
    styleUrls: ['./secured-image.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecuredImageComponent {
    private readonly src$ = new BehaviorSubject('');

    public constructor(
        private readonly httpClient: HttpClient,
        private readonly domSanitizer: DomSanitizer,
        private readonly auth: AuthService,
    ) {
        effect(() => {
            this.src$.next(this.src());
        });
    }

    public readonly src = input<string>('');

    public readonly alt = input<string | undefined>();

    public readonly class = input<string | undefined>();

    public readonly width = input<number | undefined>();

    public readonly height = input<number | undefined>();

    public readonly dataUrl = toSignal(
        this.src$.asObservable().pipe(
            skipWhile(src => !src),
            switchMap(src => this.loadImage(src)),
        ),
    );

    private loadImage(url: string): Observable<unknown> {
        return this.auth.userId.pipe(
            first(userId => userId !== undefined),
            mergeMap(() =>
                this.httpClient
                    .get(url, { responseType: 'blob' })
                    .pipe(map(blob => this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob)))),
            ),
        );
    }
}
