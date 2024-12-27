/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DownloadService } from 'aas-lib';
import { AASEndpoint } from 'aas-core';

@Component({
    selector: 'fhg-upload-form',
    templateUrl: './upload-form.component.html',
    styleUrls: ['./upload-form.component.scss'],
    imports: [FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFormComponent {
    private uploading = false;
    private files: FileList | null = null;

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly download: DownloadService,
    ) {}

    public readonly endpoint = signal<AASEndpoint | null>(null);

    public readonly endpoints = signal<AASEndpoint[]>([]);

    public readonly progress = signal(0);

    public setFiles(files: FileList | null): void {
        this.files = files;
    }

    public canSubmit(): boolean {
        return this.files != null && this.files.length > 0 && this.endpoint() != null;
    }

    public submit(): void {
        const endpoint = this.endpoint();
        if (!this.uploading && endpoint) {
            this.uploading = true;
            const file = this.files![0];
            this.download.uploadDocuments(endpoint.name, [file]).subscribe({
                next: (event: HttpEvent<unknown>) => {
                    switch (event.type) {
                        case HttpEventType.Sent:
                            break;
                        case HttpEventType.ResponseHeader:
                            break;
                        case HttpEventType.UploadProgress:
                            this.progress.set(Math.round((event.loaded / event.total!) * 100));
                            break;
                        case HttpEventType.Response:
                            break;
                    }
                },
                complete: () => this.modal.close(file.name),
                error: error => this.modal.dismiss(error),
            });
        }
    }

    public cancel(): void {
        if (!this.uploading) {
            this.modal.close();
        }
    }
}
