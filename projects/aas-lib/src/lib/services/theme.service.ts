/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private readonly STORAGE_KEY = 'aas-portal-theme';
    public readonly theme = signal<Theme>(this.getStoredTheme());

    public constructor() {
        this.applyTheme(this.theme());
    }

    public toggleTheme(): void {
        const newTheme: Theme = this.theme() === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    public setTheme(theme: Theme): void {
        this.theme.set(theme);
        this.applyTheme(theme);
        this.saveTheme(theme);
    }

    private applyTheme(theme: Theme): void {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-bs-theme', theme);
        }
    }

    private getStoredTheme(): Theme {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored === 'dark' || stored === 'light') {
                return stored;
            }
        }
        return 'light';
    }

    private saveTheme(theme: Theme): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
    }
}
