/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs from 'fs';
import { describe, beforeEach, it, expect, Mocked, vi, afterEach } from 'vitest';
import { Logger } from 'aas-package';

import { LocalCookieStorage } from './local-cookie-storage.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable';

describe('LocalCookieStorage', () => {
    let logger: Mocked<Logger>;
    let storage: LocalCookieStorage;
    let variable: Mocked<Variable>;

    beforeEach(async () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>([], { COOKIE_STORAGE: undefined });
        storage = new LocalCookieStorage(logger, variable);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getCookie', () => {
        it('should return false if cookie file does not exist', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);
            await expect(storage.getCookie('unknown@email.com', 'cookie1')).resolves.toBeUndefined();
        });

        it('should return true if cookie exists', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify([{ name: 'cookie1', data: 'data' }]));
            await expect(storage.getCookie('john.doe@email.com', 'cookie1')).resolves.toEqual('data');
        });
    });

    describe('setCookie', () => {
        it('should create cookie file if it does not exist', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);
            const writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await expect(storage.setCookie('john.doe@email.com', 'cookie1', 'data')).resolves.toBeUndefined();
            expect(writeFileSpy).toHaveBeenCalled();
        });

        it('should update existing cookie', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify([{ name: 'cookie1', data: 'data' }]));
            const writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await expect(storage.setCookie('john.doe@email.com', 'cookie1', 'data')).resolves.toBeUndefined();
            expect(writeFileSpy).toHaveBeenCalled();
        });
    });

    describe('deleteCookie', () => {
        it('should do nothing if cookie file does not exist', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);
            const unlinkSpy = vi.spyOn(fs.promises, 'unlink').mockResolvedValue();
            await expect(storage.deleteCookie('john.doe@email.com', 'cookie1')).resolves.toBeUndefined();
            expect(unlinkSpy).not.toHaveBeenCalled();
        });

        it('should delete cookie and file if it was the only cookie', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify([{ name: 'cookie1', data: 'data' }]));
            const unlinkSpy = vi.spyOn(fs.promises, 'unlink').mockResolvedValue();
            await expect(storage.deleteCookie('john.doe@email.com', 'cookie1')).resolves.toBeUndefined();
            expect(unlinkSpy).toHaveBeenCalled();
        });

        it('should delete cookie and update file if there are other cookies', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(
                JSON.stringify([
                    { name: 'cookie1', data: 'data' },
                    { name: 'cookie2', data: 'data' },
                ]),
            );
            const writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await expect(storage.deleteCookie('john.doe@email.com', 'cookie1')).resolves.toBeUndefined();
            expect(writeFileSpy).toHaveBeenCalledWith(
                expect.any(String),
                JSON.stringify([{ name: 'cookie2', data: 'data' }]),
            );
        });
    });

    describe('getEndpoints', () => {
        it('should return empty array if endpoints cookie does not exist', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify([]));
            await expect(storage.getEndpoints('john.doe@email.com')).resolves.toEqual([]);
        });

        it('should return endpoints', async () => {
            const endpoints = [{ name: 'endpoint1', auth: { token: 'data' } }];
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(
                JSON.stringify([{ name: 'endpoints', data: JSON.stringify(endpoints) }]),
            );

            await expect(storage.getEndpoints('john.doe@email.com')).resolves.toEqual(endpoints);
        });
    });

    describe('setEndpoints', () => {
        it('should set endpoints', async () => {
            const endpoints = [{ name: 'endpoint1', headers: { token: 'data' } }];
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify([]));
            const writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await expect(storage.updatesEndpoints('john.doe@email.com', endpoints)).resolves.toBeUndefined();
            expect(writeFileSpy).toHaveBeenCalledWith(
                expect.any(String),
                JSON.stringify([{ name: 'endpoints', data: JSON.stringify(endpoints) }]),
            );
        });
    });
});
