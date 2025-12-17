/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
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
    OnDestroy,
} from '@angular/core';
import { encodeBase64Url, NotifyService, ProgressService, ToolbarService, WINDOW } from 'aas-lib';

import { ShellsDataItem, ShellsService } from './shells.service';
import { MaxLengthPipe } from '../max-length.pipe';
import { catchError, concatMap, EMPTY, map, Observable, of } from 'rxjs';

@Component({
    selector: 'fhg-shells',
    templateUrl: './shells.component.html',
    styleUrl: './shells.component.scss',
    imports: [MaxLengthPipe, FormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellsComponent implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly state = inject(ShellsService);
    private readonly progress = inject(ProgressService);
    private readonly notify = inject(NotifyService);
    private readonly window = inject(WINDOW);
    private shiftKey = false;
    private altKey = false;

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

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    public readonly shellsToolbar = viewChild<TemplateRef<unknown>>('shellsToolbar');

    public readonly inputFiles = viewChild<ElementRef<HTMLInputElement>>('inputFiles');

    /**
     * The files selected for upload.
     */
    public readonly files = model<string[]>();

    /**
     * Indicates whether at least one item in the current items list is selected.
     *
     * @returns `true` when there is at least one selected item and the items list contains one or more entries; otherwise `false`.
     */
    public readonly someSelected = computed(() => {
        const items = this.items();
        return items.length > 0 && items.some(item => item.selected);
    });

    public readonly items = this.state.items;

    public readonly limit = this.state.limit;

    /**
     * Indicates whether the current page is the first page.
     *
     * @returns `true` when the current page has no previous page.
     */
    public readonly isFirstPage = computed(() => {
        const current = this.state.current();
        return current?.previous == null;
    });

    /**
     * Indicates whether the currently selected page is the last page.
     *
     * @returns `true` when the current page has no next page.
     */
    public readonly isLastPage = computed(() => {
        const current = this.state.current();
        return current?.next == null;
    });

    public ngOnDestroy(): void {
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public getFirstPage(): void {
        this.state.cursor.set({ next: undefined, previous: undefined });
    }

    public getPreviousPage(): void {
        const current = this.state.current();
        if (!current?.previous) {
            return;
        }

        this.state.cursor.set({ previous: current.previous, next: undefined });
    }

    public getNextPage(): void {
        const current = this.state.current();
        if (!current?.next) {
            return;
        }

        this.state.cursor.set({ next: current.next, previous: undefined });
    }

    public getLastPage(): void {
        this.state.cursor.set({ next: null, previous: null });
    }

    public setSelected(value: ShellsDataItem, selected: boolean): void {
        let items: ShellsDataItem[] = [];
        if (this.altKey) {
            items = this.singleSelect(value, selected);
        } else if (this.shiftKey) {
            if (selected) {
                items = this.selectRange(value);
            } else {
                items = this.deselectRange(value);
            }
        } else {
            items = this.items().map(item => (value === item ? { ...item, selected } : item));
        }

        this.state.update({ items });
    }

    public getLink(item: ShellsDataItem): string {
        return `/shells/${encodeBase64Url(item.id)}`;
    }

    public downloadPackages(): Observable<void> {
        return of(...this.items().filter(item => item.selected)).pipe(
            concatMap(item => this.state.downloadPackage(item.id)),
        );
    }

    public deletePackages(): Observable<void> {
        return of(...this.items().filter(item => item.selected)).pipe(
            concatMap(item => this.state.deletePackage(item.id)),
        );
    }

    private selectRange(value: ShellsDataItem): ShellsDataItem[] {
        let items = this.items();
        const index = items.indexOf(value);
        let begin = index;
        let end = index;
        const last = this.findLastSelectedIndex(items);
        if (last >= 0) {
            if (last > index) {
                begin = index;
                end = last;
            } else if (last < index) {
                begin = this.findFirstSelectedIndex(items);
                end = index;
            }
        }

        return items.map((item, index) => {
            if (index >= begin && index <= end) {
                return item.selected ? item : { ...item, selected: true };
            }

            return item.selected ? { ...item, selected: false } : item;
        });
    }

    private findFirstSelectedIndex(items: ShellsDataItem[]): number {
        for (let i = 0; i < items.length; i++) {
            if (items[i].selected) {
                return i;
            }
        }
        return -1;
    }

    private findLastSelectedIndex(items: ShellsDataItem[]): number {
        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].selected) {
                return i;
            }
        }
        return -1;
    }

    private deselectRange(value: ShellsDataItem): ShellsDataItem[] {
        let items = this.items();
        const index = items.indexOf(value);
        return items.map((item, i) => (i <= index ? { ...item, selected: false } : item));
    }

    private singleSelect(value: ShellsDataItem, selected: boolean): ShellsDataItem[] {
        return this.items().map(item => (value === item ? { ...item, selected } : { ...item, selected: false }));
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

    private keyup = (): void => {
        this.shiftKey = false;
        this.altKey = false;
    };

    private keydown = (event: KeyboardEvent): void => {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    };
}
