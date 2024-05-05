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
import { FormsModule } from '@angular/forms';

import { NotifyComponent } from './notify/notify.component';
import { LocalizeComponent } from './localize/localize.component';
import { LoginFormComponent } from './auth/login-form/login-form.component';
import { RegisterFormComponent } from './auth/register-form/register-form.component';
import { ProfileFormComponent } from './auth/profile-form/profile-form.component';
import { AuthComponent } from './auth/auth.component';
import { LibraryTableComponent } from './library-table/library-table.component';
import { HttpClientModule } from '@angular/common/http';
import { MaxLengthPipe } from './max-length.pipe';
import { AASTableComponent } from './aas-table/aas-table.component';
import { SortableHeaderDirective } from './sortable-header.directive';
import { AASTreeComponent } from './aas-tree/aas-tree.component';
import { OperationCallFormComponent } from './aas-tree/operation-call-form/operation-call-form.component';
import { ShowImageFormComponent } from './aas-tree/show-image-form/show-image-form.component';
import { ShowVideoFormComponent } from './aas-tree/show-video-form/show-video-form.component';
import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { ScoreComponent } from './score/score.component';
import { DigitalNameplateComponent } from './digital-nameplate/digital-nameplate.component';
import { MessageTableComponent } from './message-table/message-table.component';
import { SecuredImageComponent } from './secured-image/secured-image.component';
import { ClipboardService } from './clipboard.service';
import { TemplateService } from './template.service';
import { IndexChangeService } from './index-change.service';

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
    imports: [CommonModule, FormsModule, TranslateModule, NgbModule, HttpClientModule],
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
    providers: [ClipboardService, TemplateService, IndexChangeService],
})
export class AASLibModule {}
