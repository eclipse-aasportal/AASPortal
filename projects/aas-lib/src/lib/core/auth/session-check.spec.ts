/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT, signal } from '@angular/core';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { of } from 'rxjs';

import { SessionCheck } from './session-check';
import { AuthService } from './auth.service';
import { createSpyObj } from '../../../test/mocks';
import { WINDOW, WindowService } from '../../shared/services/window.service';
import { SessionUser } from 'aas-core';

if (!TestBed.platform) {
    TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
}

describe('SessionCheck', () => {
    let service: SessionCheck;
    let auth: Mocked<AuthService>;
    let window: Mocked<WindowService>;
    let document: Document;
    let user: ReturnType<typeof signal<SessionUser | null>>;
    let iframe: HTMLIFrameElement;
    const sessionUser: SessionUser = {
        id: 'user',
        name: 'User',
        role: 'reader',
        client_id: 'client',
        session_state: 'state',
        check_session_iframe: 'https://identity.example/check-session',
    };

    beforeEach(() => {
        user = signal<SessionUser | null>(sessionUser);
        auth = createSpyObj<AuthService>(['logout'], {
            user: user.asReadonly(),
        });

        auth.logout.mockReturnValue(of(undefined));

        window = createSpyObj<WindowService>(['addEventListener', 'removeEventListener']);
        document = globalThis.document;
        iframe = document.createElement('iframe');
        vi.spyOn(document, 'getElementById').mockReturnValue(null);
        vi.spyOn(document, 'createElement').mockReturnValue(iframe);

        vi.useFakeTimers();
        TestBed.configureTestingModule({
            providers: [
                SessionCheck,
                { provide: AuthService, useValue: auth },
                { provide: WINDOW, useValue: window },
                { provide: DOCUMENT, useValue: document },
            ],
        });

        service = TestBed.inject(SessionCheck);
        TestBed.tick();
    });

    afterEach(() => {
        service.ngOnDestroy();
        TestBed.resetTestingModule();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should stop checks when the user changes', () => {
        expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

        user.set(null);
        TestBed.tick();

        expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
        expect(iframe.isConnected).toBe(false);
    });

    it('should only logout for a message from the session iframe', () => {
        const messageHandler = window.addEventListener.mock.calls[0][1] as (event: MessageEvent) => void;
        const origin = 'https://identity.example';

        messageHandler({ origin, source: window as unknown as MessageEventSource, data: 'changed' } as MessageEvent);
        expect(auth.logout).not.toHaveBeenCalled();

        messageHandler({ origin, source: iframe.contentWindow, data: 'changed' } as MessageEvent);
        expect(auth.logout).toHaveBeenCalledTimes(1);
    });

    it('should stop session checks on destruction', () => {
        service.ngOnDestroy();

        expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
});
