/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'fhg-theme-toggle',
    templateUrl: './theme-toggle.component.html',
    styleUrls: ['./theme-toggle.component.scss'],
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
    private readonly themeService = inject(ThemeService);

    public readonly theme = this.themeService.theme;

    public toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}
