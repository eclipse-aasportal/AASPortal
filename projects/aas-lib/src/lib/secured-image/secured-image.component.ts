/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'fhg-img',
    templateUrl: './secured-image.component.html',
    styleUrls: ['./secured-image.component.scss'],
})
export class SecuredImageComponent implements OnChanges {
    public constructor(
        private httpClient: HttpClient,
        private domSanitizer: DomSanitizer,
    ) {
        this.dataUrl$ = this.src$.pipe(switchMap(url => this.loadImage(url)));
    }

    @Input()
    public src = '';
    private src$ = new BehaviorSubject(this.src);

    @Input()
    public alt?: string;

    @Input()
    public classname?: string;

    @Input()
    public width = -1;

    @Input()
    public height = -1;

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['src']) {
            this.src$.next(this.src);
        }
    }

    public readonly dataUrl$: Observable<unknown>;

    public onError(img: HTMLImageElement): void {
        img.src = img.alt;
    }

    private loadImage(url: string): Observable<unknown> {
        return this.httpClient
            .get(url, { responseType: 'blob' })
            .pipe(map(e => this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(e))));
    }
}
