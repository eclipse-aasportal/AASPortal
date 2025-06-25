/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

// import { of } from 'rxjs';
// import { provideZonelessChangeDetection } from '@angular/core';
// import { TestBed } from '@angular/core/testing';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { provideHttpClient } from '@angular/common/http';

// import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';
// import { AuthService } from '../../../lib/features/auth/auth.service';

// describe('SecuredImageComponent', () => {
//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [SecuredImageComponent],
//             providers: [
//                 {
//                     provide: AuthService,
//                     useValue: jasmine.createSpyObj<AuthService>({}, { userId: of('guest') }),
//                 },
//                 provideHttpClient(),
//                 provideHttpClientTesting(),
//                 provideZonelessChangeDetection(),
//             ],
//         }).compileComponents();
//     });

//     it('should create', () => {
//         const fixture = TestBed.createComponent(SecuredImageComponent);
//         const component = fixture.componentInstance;
//         fixture.detectChanges();
//         expect(component).toBeTruthy();
//     });
// });