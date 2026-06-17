/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ErrorHandler, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageEntry } from '../../types';
import { messageToString } from '../../utilities';

export const LogType = {
    Error: 'Error',
    Warning: 'Warning',
    Info: 'Info',
    Debug: 'Debug',
} as const;

export type LogType = (typeof LogType)[keyof typeof LogType];

@Injectable({
    providedIn: 'root',
})
export class NotifyService implements ErrorHandler {
    private readonly translate = inject(TranslateService);
    private readonly _messages = signal<MessageEntry[]>([]);

    public readonly messages = this._messages.asReadonly();

    /**
     * Displays an error message.
     * @param error The error message.
     */
    public error(error: unknown, args?: Record<string, unknown>): void {
        if (!error) {
            return;
        }

        const text =
            typeof error === 'string' ? this.translate.instant(error, args) : messageToString(error, this.translate);

        this._messages.update(values => [
            ...values,
            {
                header: this.translate.instant('Notify.ERROR'),
                text,
                classname: 'bg-danger',
                autohide: false,
                delay: 5000,
            },
        ]);
    }

    /**
     * Displays an information to the user.
     * @param message The message.
     */
    public info(message: string, args?: Record<string, unknown>): void {
        if (!message) {
            return;
        }

        this._messages.update(values => [
            ...values,
            {
                header: this.translate.instant('Notify.INFO'),
                text: this.translate.instant(message, args),
                classname: 'bg-info',
                autohide: true,
                delay: 5000,
            },
        ]);
    }

    /**
     * Removes the specified message.
     * @param message The message to remove.
     */
    public remove(message: MessageEntry): void {
        this._messages.update(values => values.filter(value => value !== message));
    }

    /**
     * Clears all messages.
     */
    public clear(): void {
        this._messages.set([]);
    }

    /**
     * Handles an error by displaying it as a message to the user.
     * @param error The error to handle.
     */
    public handleError(error: unknown): void {
        console.error(error);
    }
}
