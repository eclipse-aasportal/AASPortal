/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    TemplateRef,
    viewChild,
    inject,
    ElementRef,
    model,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { encodeBase64Url, NotifyService, ProgressService, ToolbarService } from 'aas-lib';

import { ShellsDataItem, ShellsService } from './shells.service';
import { MaxLengthPipe } from '../max-length.pipe';
import { catchError, concatMap, EMPTY, map, Observable, of } from 'rxjs';
import { HttpEventType } from '@angular/common/http';

@Component({
    selector: 'fhg-shells',
    templateUrl: './shells.component.html',
    styleUrl: './shells.component.scss',
    imports: [MaxLengthPipe, FormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellsComponent {
    private readonly toolbar = inject(ToolbarService);
    private readonly state = inject(ShellsService);
    private readonly progress = inject(ProgressService);
    private readonly notify = inject(NotifyService);

    public constructor() {
        effect(() => {
            const shellsToolbar = this.shellsToolbar();
            if (shellsToolbar) {
                this.toolbar.set(shellsToolbar);
            }
        });

        effect(() => {
            const files = this.files();
            const inputFiles = this.inputFiles();
            if (!files || !inputFiles) {
                return;
            }

            const fileList = inputFiles.nativeElement.files;
            if (!fileList) {
                return;
            }

            this.progress.begin();
            this.uploadPackages(Array.from(fileList)).subscribe({
                error: () => {
                    this.progress.end();
                    this.files.set(undefined);
                },
                complete: () => {
                    this.progress.end();
                    this.files.set(undefined);
                },
            });
        });
    }

    public readonly shellsToolbar = viewChild<TemplateRef<unknown>>('shellsToolbar');

    public readonly inputFiles = viewChild<ElementRef<HTMLInputElement>>('inputFiles');

    /**
     * The files selected for upload.
     */
    public readonly files = model<string[]>();

    public readonly someSelected = computed(() => {
        return false;
    });

    public readonly items = this.state.page.value;

    public readonly limit = this.state.limit;

    public readonly isFirstPage = computed(() => {
        const current = this.state.page.value().cursor;
        return current?.previous == null;
    });

    public readonly isLastPage = computed(() => {
        const current = this.state.page.value().cursor;
        return current?.next == null;
    });

    public getFirstPage(): void {
        this.state.cursor.set({});
    }

    public getPreviousPage(): void {
        const current = this.state.page.value().cursor;
        if (!current?.previous) {
            return;
        }

        this.state.cursor.set({ previous: current.previous });
    }

    public getNextPage(): void {
        const current = this.state.page.value().cursor;
        if (!current?.next) {
            return;
        }

        this.state.cursor.set({ next: current.next });
    }

    public getLastPage(): void {
        this.state.cursor.set({ next: null, previous: null });
    }

    public getThumbnailSource(item: ShellsDataItem): string {
        if (item.thumbnail) {
            return item.thumbnail;
        }

        return '/assets/aas-idta.png';
    }

    public getLink(item: ShellsDataItem): string {
        return `/shells/${encodeBase64Url(item.id)}`;
    }

    public downloadPackages(): void {
        throw new Error('Method not implemented.');
    }

    public deletePackages(): void {
        throw new Error('Method not implemented.');
    }

    private uploadPackages(files: File[]): Observable<void> {
        return of(...files).pipe(
            concatMap(file => {
                const inputFiles = this.inputFiles()?.nativeElement.files;
                if (!inputFiles) {
                    return EMPTY;
                }

                return this.state.uploadPackage(file).pipe(
                    catchError(error => {
                        this.notify.error(error);
                        return of();
                    }),
                    map(event => {
                        if (event.type === HttpEventType.UploadProgress) {
                            this.progress.set(Math.round((event.loaded / event.total!) * 100), file.name);
                        } else if (event.type === HttpEventType.Response) {
                            this.notify.info('Info.FILE_SUCCESSFULLY_UPLOADED', { file: file.name });
                        }
                    }),
                );
            }),
        );
    }
}
