/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WindowService {
    /**
     * Opens a new browser window for the specified URL.
     * @param url The URL.
     */
    public open(url: string): void {
        window.open(url, '_blank');
    }

    public alert(message: string): void {
        window.alert(message);
    }

    public prompt(message: string): string | null {
        return window.prompt(message);
    }

    public confirm(message: string): boolean | undefined {
        return window.confirm(message);
    }
    
    public getQueryParams(): URLSearchParams {
        return new URLSearchParams(window.location.search);
    }

    public getLocalStorageItem(key: string): string | null {
        return window.localStorage.getItem(key);
    }

    public setLocalStorageItem(key: string, value: string): void {
        window.localStorage.setItem(key, value);
    }

    public removeLocalStorageItem(key: string): void {
        window.localStorage.removeItem(key);
    }

    public clearLocalStorage(): void {
        window.localStorage.clear();
    }
}