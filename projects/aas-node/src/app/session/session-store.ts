import { container, InjectionToken } from 'tsyringe';
import session, { SessionData } from 'express-session';
import { Variable } from '../variable.js';

export const SESSION_STORE: InjectionToken<SessionStore> = Symbol('SESSION_STORE');

export interface ToJson {
    toJSON(value: unknown): session.Cookie;
}

export function isToJson(value: unknown): value is ToJson {
    return value !== null && typeof value === 'object' && typeof (value as ToJson).toJSON === 'function';
}

export abstract class SessionStore extends session.Store {
    protected readonly variable = container.resolve(Variable);

    protected getTTL(data: SessionData): number {
        let ttl;
        if (data?.cookie?.expires) {
            const ms = Number(new Date(data.cookie.expires)) - Date.now();
            ttl = Math.ceil(ms / 1000);
        } else {
            ttl = this.variable.SESSION_TTL;
        }

        return ttl;
    }
}
