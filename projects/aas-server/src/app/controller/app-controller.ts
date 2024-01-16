/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Get, OperationId, Route, Security, Tags } from 'tsoa';
import { ApplicationInfo } from '../application-info.js';
import { Logger } from '../logging/logger.js';
import { AASController } from './aas-controller.js';
import { AuthService } from '../auth/auth-service.js';
import { Variable } from '../variable.js';
import { Message, PackageInfo } from 'common';

@injectable()
@Route('/api/v1/app')
@Tags('App')
export class AppController extends AASController {
    public constructor(
        @inject('Logger') logger: Logger,
        @inject(AuthService) auth: AuthService,
        @inject(Variable) variable: Variable,
        @inject(ApplicationInfo) private readonly applicationInfo: ApplicationInfo,
    ) {
        super(logger, auth, variable);
    }

    /**
     * @summary Gets the license info.
     * @returns ToDo
     */
    @Get('info')
    @Security('bearerAuth', ['guest'])
    @OperationId('getInfo')
    public async getInfo(): Promise<PackageInfo> {
        try {
            this.logger.start('getInfo');
            return await this.applicationInfo.getAsync();
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Gets the log messages from the AASServer.
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
