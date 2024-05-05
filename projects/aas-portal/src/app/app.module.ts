/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { AASLibModule } from 'aas-lib';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { AboutComponent } from './about/about.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AASComponent } from './aas/aas.component';
import { StartComponent } from './start/start.component';
import { NewElementFormComponent } from './aas/new-element-form/new-element-form.component';
import { EditElementFormComponent } from './aas/edit-element-form/edit-element-form.component';
import { RemoveEndpointFormComponent } from './start/remove-endpoint-form/remove-endpoint-form.component';
import { UploadFormComponent } from './start/upload-form/upload-form.component';
import { ViewComponent } from './view/view.component';
import { AddEndpointFormComponent } from './start/add-endpoint-form/add-endpoint-form.component';
import { HttpLoaderFactory } from './http-loader-factory';
import { httpInterceptorProviders } from './index';
import { FavoritesFormComponent } from './start/favorites-form/favorites-form.component';

@NgModule({
    declarations: [
        AppComponent,
        MainComponent,
        AboutComponent,
        DashboardComponent,
        AASComponent,
        StartComponent,
        AddEndpointFormComponent,
        RemoveEndpointFormComponent,
        NewElementFormComponent,
        EditElementFormComponent,
        UploadFormComponent,
        ViewComponent,
        FavoritesFormComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        NgbModule,
        TranslateModule.forRoot({
            defaultLanguage: 'en-us',
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        AASLibModule,
    ],
    providers: [httpInterceptorProviders],
    bootstrap: [AppComponent],
})
export class AppModule {}
