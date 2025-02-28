/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { LicenseInfoComponent } from '../../lib/license-info/license-info.component';

describe('LicenseInfoComponent', () => {
    let component: LicenseInfoComponent;
    let fixture: ComponentFixture<LicenseInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    defaultLanguage: 'en-us',
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(LicenseInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        fixture.componentRef.setInput('libraries', [
            {
                name: '@angular-devkit/build-angular',
                version: '18.2.3',
                description: 'Angular Webpack Build Facade',
                license: 'MIT',
                licenseText: 'License text...',
                homepage: 'https://github.com/angular/angular-cli',
            },
            {
                name: '@angular-eslint/builder',
                version: '18.3.0',
                description: 'Angular CLI builder for ESLint',
                license: 'MIT',
                licenseText: 'License text...',
            },
            {
                name: '@angular-eslint/eslint-plugin',
                version: '18.3.0',
                description: 'ESLint plugin for Angular applications, following https://angular.dev/style-guide',
                license: 'MIT',
                licenseText: 'License text...',
            },
        ]);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a license text', () => {
        expect(component.text()).toBeDefined();
    });
});