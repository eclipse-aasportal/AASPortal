/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { EffectsModule } from '@ngrx/effects';

import { NotifyComponent } from './notify/notify.component';
import { LocalizeComponent } from './localize/localize.component';
import { LoginFormComponent } from './auth/login-form/login-form.component';
import { RegisterFormComponent } from './auth/register-form/register-form.component';
import { ProfileFormComponent } from './auth/profile-form/profile-form.component';
import { AuthComponent } from './auth/auth.component';
import { LibraryTableComponent } from './library-table/library-table.component';
import { HttpClientModule } from '@angular/common/http';
import { aasTableReducer } from './aas-table/aas-table.reducer';
import { MaxLengthPipe } from './max-length.pipe';
import { AASTableComponent } from './aas-table/aas-table.component';
import { SortableHeaderDirective } from './sortable-header.directive';
import { AASTreeComponent } from './aas-tree/aas-tree.component';
import { aasTreeReducer } from './aas-tree/aas-tree.reducer';
import { OperationCallFormComponent } from './aas-tree/operation-call-form/operation-call-form.component';
import { ShowImageFormComponent } from './aas-tree/show-image-form/show-image-form.component';
import { ShowVideoFormComponent } from './aas-tree/show-video-form/show-video-form.component';
import { customerFeedbackReducer } from './customer-feedback/customer-feedback.reducer';
import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { ScoreComponent } from './score/score.component';
import { DigitalNameplateComponent } from './digital-nameplate/digital-nameplate.component';
import { messageTableReducer } from './message-table/massage-table.reducer';
import { MessageTableComponent } from './message-table/message-table.component';
import { SecuredImageComponent } from './secured-image/secured-image.component';
import { AASTableEffects } from './aas-table/aas-table.effects';
import { ClipboardService } from './clipboard.service';
import { TemplateService } from './template.service';

@NgModule({
    declarations: [
        NotifyComponent,
        LocalizeComponent,
        LoginFormComponent,
        RegisterFormComponent,
        ProfileFormComponent,
        AuthComponent,
        LibraryTableComponent,
        MaxLengthPipe,
        SortableHeaderDirective,
        AASTableComponent,
        AASTreeComponent,
        OperationCallFormComponent,
        ShowImageFormComponent,
        ShowVideoFormComponent,
        CustomerFeedbackComponent,
        ScoreComponent,
        DigitalNameplateComponent,
        MessageTableComponent,
        SecuredImageComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        NgbModule,
        StoreModule.forFeature('messageTable', messageTableReducer),
        StoreModule.forFeature('customerFeedback', customerFeedbackReducer),
        StoreModule.forFeature('aasTable', aasTableReducer),
        StoreModule.forFeature('tree', aasTreeReducer),
        EffectsModule.forFeature(AASTableEffects),
        HttpClientModule,
    ],
    exports: [
        NotifyComponent,
        LocalizeComponent,
        LoginFormComponent,
        RegisterFormComponent,
        ProfileFormComponent,
        AuthComponent,
        LibraryTableComponent,
        MaxLengthPipe,
        SortableHeaderDirective,
        AASTableComponent,
        AASTreeComponent,
        CustomerFeedbackComponent,
        ScoreComponent,
        DigitalNameplateComponent,
        MessageTableComponent,
        SecuredImageComponent,
    ],
    providers: [ClipboardService, TemplateService],
})
export class AASLibModule {}
