/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { StoreModule } from '@ngrx/store';
import { NgbModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap'
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { AASLibModule } from 'aas-lib';
import { EffectsModule } from '@ngrx/effects';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { AboutComponent } from './about/about.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AASComponent } from './aas/aas.component';
import { StartComponent } from './start/start.component';
import { startReducer } from './start/start.reducer';
import { NewElementFormComponent } from './aas/new-element-form/new-element-form.component';
import { EditElementFormComponent } from './aas/edit-element-form/edit-element-form.component';
import { aasReducer } from './aas/aas.reducer';
import { RemoveEndpointFormComponent } from './start/remove-endpoint-form/remove-endpoint-form.component';
import { dashboardReducer } from './dashboard/dashboard.reducer';
import { UploadFormComponent } from './start/upload-form/upload-form.component';
import { ViewComponent } from './view/view.component';
import { viewReducer } from './view/view.reducer';
import { AddEndpointFormComponent } from './start/add-endpoint-form/add-endpoint-form.component';
import { projectReducer } from './project/project.reducer';
import { ProjectEffects } from './project/project.effects';
import { HttpLoaderFactory } from './http-loader-factory';
import { httpInterceptorProviders } from './index';

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
        ViewComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        StoreModule.forRoot(
            {
                start: startReducer,
                aas: aasReducer,
                view: viewReducer,
                dashboard: dashboardReducer,
                project: projectReducer
            }),
        EffectsModule.forRoot([ProjectEffects]),
        NgbModule,
        NgbTypeaheadModule,
        TranslateModule.forRoot({
            defaultLanguage: 'en-us',
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        AASLibModule,
    ],
    providers: [
        httpInterceptorProviders
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }