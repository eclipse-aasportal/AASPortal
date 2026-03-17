/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { Mocked, vi } from 'vitest';
import { noop } from 'aas-core';

type Func = () => any;

export class FakeLoader extends TranslateLoader {
    public override getTranslation(lang: string): Observable<TranslationObject> {
        noop(lang);
        return of({});
    }
}

export type SpyObjMethodNames<T = undefined> = T extends undefined
    ? ReadonlyArray<string> | { [methodName: string]: any }
    : ReadonlyArray<keyof T> | { [P in keyof T]?: T[P] extends Func ? ReturnType<T[P]> : any };

export type SpyObjPropertyNames<T = undefined> = T extends undefined
    ? ReadonlyArray<string> | { [propertyName: string]: any }
    : ReadonlyArray<keyof T> | { [P in keyof T]?: T[P] };

export function createSpyObj<T extends object>(
    methodNames: SpyObjMethodNames<T>,
    propertyNames?: SpyObjPropertyNames<T>,
): Mocked<T> {
    const obj: { [key: string]: unknown } = {};
    if (Array.isArray(methodNames)) {
        for (const methodName of methodNames) {
            obj[methodName as string] = vi.fn();
        }
    } else {
        for (const methodName in methodNames) {
            obj[methodName] = vi.fn();
        }
    }

    if (propertyNames) {
        if (Array.isArray(propertyNames)) {
            for (const propertyName of propertyNames) {
                obj[propertyName] = propertyNames[propertyName];
            }
        } else {
            for (const propertyName in propertyNames) {
                obj[propertyName] = propertyNames[propertyName];
            }
        }
    }

    return obj as Mocked<T>;
}

export function mockFetchJson(
    data: unknown,
    options?: { ok?: boolean; status?: number; headers?: Record<string, string> },
) {
    const { ok = true, status = 200, headers } = options || {};
    const mock = vi.fn().mockImplementation(() =>
        Promise.resolve({
            ok,
            status,
            headers,
            json: () => Promise.resolve(data),
            text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
        }),
    );
    (global as any).fetch = mock;
    return mock;
}

export function mockFetchReject(error: unknown) {
    const mock = vi.fn().mockImplementation(() => Promise.reject(error));
    (global as any).fetch = mock;
    return mock;
}

export function restoreFetch() {
    try {
        // Remove global fetch so tests can restore environment
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete (global as any).fetch;
    } catch {
        (global as any).fetch = undefined;
    }
}

export class MockWebSocketService {
    private mockSubject = new Subject<any>();

    public sendMessage(message: any): void {
        this.mockSubject.next({ data: message });
    }

    public getMessages(): Observable<any> {
        return this.mockSubject.asObservable();
    }

    public closeConnection(): void {
        this.mockSubject.complete();
    }
}
