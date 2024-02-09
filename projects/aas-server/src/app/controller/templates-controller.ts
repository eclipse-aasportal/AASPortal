/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Get, OperationId, Route, Security, Tags } from 'tsoa';
import { Logger } from '../logging/logger.js';
import { AASController } from './aas-controller.js';
import { AuthService } from '../auth/auth-service.js';
import { Variable } from '../variable.js';
import { TemplateDescriptor } from 'common';
import { TemplateStorage } from '../template/template-storage.js';

/**
 * Asset Administration Shell referable templates.
 */
@injectable()
@Route('/api/v1/templates')
@Tags('Templates')
export class TemplatesController extends AASController {
    public constructor(
        @inject('Logger') logger: Logger,
        @inject(AuthService) auth: AuthService,
        @inject(Variable) variable: Variable,
        @inject(TemplateStorage) private readonly templateStorage: TemplateStorage,
    ) {
        super(logger, auth, variable);
    }

    /**
     * @summary Gets all templates.
     * @returns All available templates.
     */
    @Get()
    @Security('bearerAuth', ['guest'])
    @OperationId('getTemplates')
    public async getTemplates(): Promise<TemplateDescriptor[]> {
        try {
            this.logger.start('templates');
            return await this.templateStorage.readAsync();
        } finally {
            this.logger.stop();
        }
    }
}
