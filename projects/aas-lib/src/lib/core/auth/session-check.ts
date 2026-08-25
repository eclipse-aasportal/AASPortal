/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DOCUMENT, effect, inject, OnDestroy, Service } from '@angular/core';
import { SessionUser } from 'aas-core';
import { WINDOW } from '../../shared/services/window.service';
import { AuthService } from './auth.service';

@Service()
export class SessionCheck implements OnDestroy {
    private readonly document = inject(DOCUMENT);
    private readonly window = inject(WINDOW);
    private readonly auth = inject(AuthService);
    private iframe: HTMLIFrameElement | null = null;
    private checkInterval: ReturnType<typeof setInterval> | undefined;

    public constructor() {
        effect(() => {
            const user = this.auth.user();
            this.stopSessionChecks();
            this.setupIframe(user);
            if (user?.client_id && user.session_state && user.check_session_iframe) {
                this.startSessionChecks(user.client_id, user.session_state);
            }
        });
    }

    public ngOnDestroy(): void {
        this.stopSessionChecks();
    }

    private setupIframe(user: SessionUser | null | undefined): void {
        const oldIframe = this.document.getElementById('AID_I_FRAME');
        if (oldIframe) {
            oldIframe.remove();
        }

        this.iframe = null;

        if (user?.check_session_iframe) {
            this.iframe = this.document.createElement('iframe');
            this.iframe.id = 'AID_I_FRAME';
            this.iframe.src = user.check_session_iframe;
            this.iframe.style.display = 'none';
            this.document.body.appendChild(this.iframe);
        }
    }

    private startSessionChecks(clientId: string, sessionState: string, intervalMs: number = 30_000): void {
        this.window.addEventListener('message', this.onMessage);
        this.checkSession(clientId, sessionState);
        this.checkInterval = setInterval(() => {
            this.checkSession(clientId, sessionState);
        }, intervalMs);
    }

    private stopSessionChecks(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }

        this.window.removeEventListener('message', this.onMessage);
        this.iframe?.remove();
        this.iframe = null;
    }

    private checkSession(clientId: string, sessionState: string): void {
        const contentWindow = this.iframe?.contentWindow;
        if (!contentWindow) {
            return;
        }

        contentWindow.postMessage(`${clientId} ${sessionState}`, this.getOpOrigin());
    }

    private readonly onMessage = (event: MessageEvent): void => {
        if (event.origin !== this.getOpOrigin() || event.source !== this.iframe?.contentWindow) {
            return;
        }

        if (event.data === 'changed') {
            this.stopSessionChecks();
            this.auth.logout().subscribe();
        } else if (event.data === 'error') {
            this.stopSessionChecks();
        }
    };

    private getOpOrigin(): string {
        const src = this.iframe?.src;
        if (!src) {
            return '';
        }

        return new URL(src).origin;
    }
}
