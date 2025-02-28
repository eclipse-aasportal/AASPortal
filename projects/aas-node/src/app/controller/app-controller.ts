/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Get, OperationId, Route, Security, Tags } from 'tsoa';
import { ApplicationInfo } from '../application-info.js';
import { Logger } from '../logging/logger.js';
import { Message, AppInfo } from 'aas-core';

@injectable()
@Route('/api/v1/app')
@Tags('App')
export class AppController extends Controller {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(ApplicationInfo) private readonly applicationInfo: ApplicationInfo,
    ) {
        super();
    }

    /**
     * @summary Gets the application info.
     * @returns The application info.
     */
    @Get('info')
    @Security('bearerAuth', ['guest'])
    @OperationId('getInfo')
    public async getInfo(): Promise<AppInfo> {
        try {
            this.logger.start('getInfo');
            return await this.applicationInfo.getAsync();
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Gets the log messages from the AASNode.
     * @returns The log messages.
     */
    @Get('messages')
    @Security('bearerAuth', ['guest'])
    @OperationId('getMessages')
    public async getMessages(): Promise<Message[]> {
        try {
            this.logger.start('getInfo');
            return await Promise.resolve(this.applicationInfo.getMessages());
        } finally {
            this.logger.stop();
        }
    }
}
