/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DownloadService } from 'aas-lib';
import { AASContainer } from 'common';

@Component({
    selector: 'fhg-upload-form',
    templateUrl: './upload-form.component.html',
    styleUrls: ['./upload-form.component.scss']
})
export class UploadFormComponent {
    private uploading = false;

    constructor(
        private readonly modal: NgbActiveModal,
        private readonly download: DownloadService) { }

    @ViewChild('fileInput')
    public fileInput: ElementRef<HTMLInputElement> | null = null;

    public files: string | string[] | null = null;

    public container: AASContainer | null = null;

    public containers: AASContainer[] = [];

    public progress = 0;

    public canSubmit(): boolean {
        return this.fileInput?.nativeElement?.files != null &&
            this.fileInput.nativeElement.files.length > 0 &&
            this.container != null;
    }

    public submit(): void {
        if (!this.uploading && this.container?.url) {
            this.uploading = true;
            const file = this.fileInput!.nativeElement!.files![0];
            this.download.uploadDocuments(this.container.url, [file])
                .subscribe({
                    next: (event: HttpEvent<any>) => {
                        switch (event.type) {
                            case HttpEventType.Sent:
                                break;
                            case HttpEventType.ResponseHeader:
                                break;
                            case HttpEventType.UploadProgress:
                                this.progress = Math.round(event.loaded / event.total! * 100);
                                break;
                            case HttpEventType.Response:
                                break;
                        }
                    },
                    complete: () => this.modal.close(file.name),
                    error: (error) => this.modal.dismiss(error)
                });
        }
    }

    public cancel(): void {
        if (!this.uploading) {
            this.modal.close();
        }
    }
}