/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Get, OperationId, Route, Security, Tags } from 'tsoa';
import { Logger } from '../logging/logger.js';
import { ControllerBase } from './controller-base.js';
import { AuthService } from '../auth/auth-service.js';
import { Variable } from '../variable.js';
import { AASWorkspace } from 'common';
import { AASProvider } from '../aas-provider/aas-provider.js';

@injectable()
@Route('/api/v1/workspaces')
@Tags('Workspaces')
export class WorkspacesController extends ControllerBase {
    constructor(
        @inject('Logger') logger: Logger,
        @inject(AuthService) auth: AuthService,
        @inject(Variable) variable: Variable,
        @inject(AASProvider) private readonly aasProvider: AASProvider
    ) {
        super(logger, auth, variable);
    }

    /**
     * @summary Gets the workspaces.
     * @returns All current available workspaces.
     */
    @Get('')
    @Security('bearerAuth', ['guest'])
    @OperationId('getWorkspaces')
    public async getWorkspaces(): Promise<AASWorkspace[]> {
        try {
            this.logger.start('getWorkspaces');
            return await Promise.resolve(this.aasProvider.getWorkspaces());
        } finally {
            this.logger.stop();
        }
    }
}