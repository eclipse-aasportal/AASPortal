/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Get, OperationId, Route, Security, Tags } from 'tsoa';
import { aas, TemplateDescriptor } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { TemplateStorage } from '../template/template-storage.js';
import { decodeBase64Url } from '../convert.js';

/**
 * Asset Administration Shell referable templates.
 */
@injectable()
@Route('/api/v1/templates')
@Tags('Templates')
export class TemplatesController extends Controller {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(TemplateStorage) private readonly templateStorage: TemplateStorage,
    ) {
        super();
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
            this.logger.start('getTemplates');
            return await this.templateStorage.getTemplatesAsync();
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Gets the template with the specified path.
     * @param path The path of the template (base64 URL encoded).
     * @returns The template.
     */
    @Get('{path}')
    @Security('bearerAuth', ['guest'])
    @OperationId('getTemplate')
    public async getTemplate(path: string): Promise<aas.Referable | aas.Environment> {
        try {
            this.logger.start('getTemplate');
            return await this.templateStorage.readTemplateAsync(decodeBase64Url(path));
        } finally {
            this.logger.stop();
        }
    }
}
