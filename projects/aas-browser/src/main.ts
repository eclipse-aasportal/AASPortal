/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

<<<<<<<< HEAD:projects/aas-lib/src/lib/views/customer-feedback/customer-feedback.types.ts
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
========
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
>>>>>>>> development:projects/aas-browser/src/main.ts
