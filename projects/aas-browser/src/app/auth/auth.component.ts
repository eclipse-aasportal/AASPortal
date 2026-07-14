/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, OnInit, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap/dropdown';

import { ApiKeyFormComponent } from './api-key-form/api-key-form.component';

@Component({
    selector: 'fhg-api-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    imports: [NgbDropdown],
})
export class AuthComponent implements OnInit {
    private readonly modal = inject(NgbModal);
    private readonly isAuthenticated$ = signal(false);

    public readonly isAuthenticated = this.isAuthenticated$.asReadonly();

    public ngOnInit(): void {
        const apiKey = localStorage.getItem('apiKey');
        this.isAuthenticated$.set(!!apiKey);
    }

    public async login(): Promise<void> {
        const apiKey = await this.modal.open(ApiKeyFormComponent, {
            backdrop: 'static',
            animation: true,
            keyboard: true,
        }).result;

        this.isAuthenticated$.set(!!apiKey);
        this.isAuthenticated() ? localStorage.setItem('apiKey', apiKey) : localStorage.removeItem('apiKey');
    }
}
