/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isElement from 'lodash-es/isElement';
import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { resolveError } from '../utilities';
import { MessageEntry } from '../types';
import { stringFormat } from 'aas-core';

export enum LogType {
    Error,
    Warning,
    Info,
    Debug,
}

@Injectable({
    providedIn: 'root',
})
export class NotifyService {
    private readonly _messages = signal<MessageEntry[]>([]);

    public constructor(private translate: TranslateService) {}

    public readonly messages = this._messages.asReadonly();

    /**
     * Displays an error message.
     * @param error The error message.
     */
    public async error(error: unknown): Promise<void> {
        if (error) {
            const text = await resolveError(error, this.translate);
            this._messages.update(values => [
                ...values,
                {
                    header: this.translate.instant('CAPTION_ERROR'),
                    text: text,
                    classname: 'bg-danger',
                    autohide: false,
                    delay: 5000,
                },
            ]);
        }
    }

    /**
     * Displays an information to the user.
     * @param message The message.
     */
    public info(message: string, ...args: unknown[]): void {
        if (message && !isElement(message)) {
            this._messages.update(values => [
                ...values,
                {
                    header: this.translate.instant('CAPTION_INFO'),
                    text: stringFormat(this.translate.instant(message), args),
                    classname: 'bg-info',
                    autohide: true,
                    delay: 5000,
                },
            ]);
        }
    }

    /**
     * Removes the specified message.
     * @param message The message to remove.
     */
    public remove(message: MessageEntry) {
        this._messages.update(values => values.filter(value => value !== message));
    }

    /**
     * Clears all messages.
     */
    public clear(): void {
        this._messages.set([]);
    }

    /**
     * Prints a message to the browser console.
     * @param type The message type.
     * @param message The message.
     */
    public log(type: LogType, message: unknown): void {
        if (message) {
            switch (type) {
                case LogType.Error:
                    console.error(message);
                    break;
                case LogType.Debug:
                    console.debug(message);
                    break;
                case LogType.Warning:
                    console.warn(message);
                    break;
                default:
                    console.log(message);
                    break;
            }
        }
    }
}
