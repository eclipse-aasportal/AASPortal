/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Library } from 'aas-core';

@Component({
    selector: 'fhg-license-info',
    templateUrl: './license-info.component.html',
    styleUrls: ['./license-info.component.scss'],
    imports: [NgbCollapseModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicenseInfoComponent {
    public readonly libraries = input<Library[]>([]);

    public readonly isCollapsed = signal(true);

    public readonly text = computed(() => {
        return this.generateLicensesText(this.libraries());
    });

    private generateLicensesText(libraries: Library[]): string {
        const licenses = new Map<string, Library[]>();
        for (const library of libraries) {
            let value = licenses.get(library.licenseText);
            if (!value) {
                value = [library];
                licenses.set(library.licenseText, value);
            } else {
                value.push(library);
            }
        }

        let text = '';
        for (const [key, value] of licenses) {
            if (value.length === 1) {
                text += 'The following npm package may be included in this product:\n\n';
                text += ` - ${value[0].name}@${value[0].version}\n\n`;
                text += 'This package contains the following license and notice below:\n\n';
            } else if (value.length > 1) {
                text += 'The following npm packages may be included in this product:\n\n';
                for (const item of value) {
                    text += ` - ${item.name}@${value[0].version}\n`;
                }

                text += '\nThese packages each contain the following license and notice below:\n\n';
            }

            text += key;
            text += '\n-----------\n\n';
        }

        return text;
    }
}
