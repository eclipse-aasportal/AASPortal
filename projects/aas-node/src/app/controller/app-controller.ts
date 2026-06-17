/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Get, OperationId, Route, Tags } from 'tsoa';
import { ApplicationInfo } from '../application-info.js';
import { AppInfo } from 'aas-core';

@injectable()
@Route('/api/v1/app')
@Tags('App')
export class AppController extends Controller {
    public constructor(@inject(ApplicationInfo) private readonly applicationInfo: ApplicationInfo) {
        super();
    }

    /**
     * @summary Gets the application info.
     * @returns The application info.
     */
    @Get('info')
    @OperationId('getInfo')
    public async getInfo(): Promise<AppInfo> {
        return await this.applicationInfo.getAsync();
    }
}
